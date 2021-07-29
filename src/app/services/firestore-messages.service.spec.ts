import { TestBed } from '@angular/core/testing';

import { FirestoreMessagesService } from './firestore-messages.service';

describe('FirestoreMessagesService', () => {
  let service: FirestoreMessagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreMessagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
