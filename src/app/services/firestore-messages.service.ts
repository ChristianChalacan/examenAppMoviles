import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreMessagesService {

  collection = 'chats';

  constructor(
    private firestore: AngularFirestore
  ) { }

  create(record) {
    console.log(record);

    return this.firestore.collection(this.collection).add(record);
  }

  read() {
    return this.firestore.collection(this.collection).snapshotChanges();
  }
}
