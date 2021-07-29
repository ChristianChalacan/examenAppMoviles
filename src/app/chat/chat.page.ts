import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthenticateService } from '../services/authentication.service';
import { FirestoreMessagesService } from '../services/firestore-messages.service';
import { AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import { FormGroup } from '@angular/forms';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { finalize, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';





// eslint-disable-next-line @typescript-eslint/naming-convention
interface messageData {
  name: string;
  message: string;
  date: Date;
}
export interface imgFile {
  name: string;
  filepath: string;
  size: number;
}
@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {

  messageList = [];
  messageData: messageData;
  messageForm: FormGroup;
  latitude: any; //latitude
  longitude: any; //longitude

  // File upload task 
  fileUploadTask: AngularFireUploadTask;

  // Upload progress
  percentageVal: Observable<number>;

  // Track file uploading with snapshot
  trackSnapshot: Observable<any>;

  // Uploaded File URL
  UploadedImageURL: Observable<string>;

  // Uploaded image collection
  files: Observable<imgFile[]>;

  // Image specifications
  imgName: string;
  imgSize: number;

  // File uploading status
  isFileUploading: boolean;
  isFileUploaded: boolean;

  private filesCollection: AngularFirestoreCollection<imgFile>;

  constructor(
    private navCtrl: NavController,
    private authService: AuthenticateService,
    private firestoremessagesservice: FirestoreMessagesService,
    private geolocation: Geolocation,
    private afs: AngularFirestore,
    private afStorage: AngularFireStorage
  ) {
    this.messageData = {} as messageData;
    this.isFileUploading = false;
    this.isFileUploaded = false;
    
    // Define uploaded files collection
    this.filesCollection = afs.collection<imgFile>('imagesCollection');
    this.files = this.filesCollection.valueChanges();
  }

  ngOnInit() {
    this.authService.userDetails().subscribe(res => {
      console.log('res', res);
      if (res !== null) {
        this.messageData.name = res.email;
      } else {
        this.navCtrl.navigateBack('');
      }
    }, err => {
      console.log('err', err);
    });

    this.firestoremessagesservice.read().subscribe(data => {
      this.messageList = data.map(e => {
        if(!e.payload.doc.data()){
          console.log('null');
        }
        return {
          id: e.payload.doc.id,
          // eslint-disable-next-line @typescript-eslint/dot-notation
          name: e.payload.doc.data()['name'],
          // eslint-disable-next-line @typescript-eslint/dot-notation
          message:e.payload.doc.data()['message']
        };
      });

    });

  }

  uploadImage(event: FileList) {
      
    const file = event.item(0)

    // Image validation
    if (file.type.split('/')[0] !== 'image') { 
      console.log('File type is not supported!')
      return;
    }

    this.isFileUploading = true;
    this.isFileUploaded = false;

    this.imgName = file.name;

    // Storage path
    const fileStoragePath = `examen/${new Date().getTime()}_${file.name}`;

    // Image reference
    const imageRef = this.afStorage.ref(fileStoragePath);

    // File upload task
    this.fileUploadTask = this.afStorage.upload(fileStoragePath, file);

    // Show uploading progress
    this.percentageVal = this.fileUploadTask.percentageChanges();
    this.trackSnapshot = this.fileUploadTask.snapshotChanges().pipe(
      
      finalize(() => {
        // Retreive uploaded image storage path
        this.UploadedImageURL = imageRef.getDownloadURL();
        
        this.UploadedImageURL.subscribe(resp=>{
          this.storeFilesFirebase({
            name: file.name,
            filepath: resp,
            size: this.imgSize
          });
          this.isFileUploading = false;
          this.isFileUploaded = true;
        },error=>{
          console.log(error);
        })
      }),
      tap(snap => {
          this.imgSize = snap.totalBytes;
      })
    )
  }
  storeFilesFirebase(image: imgFile) {
    const fileId = this.afs.createId();
    
    this.filesCollection.doc(fileId).set(image).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    });
}

  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateRecord() {
    this.messageData.date = new Date();
    this.messageData.message = this.messageData.message.toString();
    this.firestoremessagesservice.create(this.messageData)
      .then(() => {
        this.messageData.message = null;
      })
      .catch(error => {
        console.log(error);
      });
  }
  CreateUbication() {
    this.messageData.date = new Date();
    this.messageData.message = "mi ubicacion es latitud "+this.latitude+" longitud "+this.latitude;
    this.firestoremessagesservice.create(this.messageData)
      .then(() => {
        this.messageData.message = null;
      })
      .catch(error => {
        console.log(error);
      });
  }
  logout() {
    this.authService.logoutUser()
      .then(res => {
        console.log(res);
        this.navCtrl.navigateBack('');
      })
      .catch(error => {
        console.log(error);
      });
  }
  getCurrentCoordinates() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
      this.CreateUbication();
     }).catch((error) => {
       console.log('Error getting location', error);
     });
  }



}
