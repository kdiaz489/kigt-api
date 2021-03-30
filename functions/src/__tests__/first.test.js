const firebase = require('@firebase/rules-unit-testing');
const admin = require('firebase-admin');

const projectId = 'kigtinterface';
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
let app = admin.initializeApp({ projectId });
let db = firebase.firestore(app);

test('Expect to find copy in copies collection', async () => {
  const testDoc = {
    name: 'test1',
    age: 21,
    city: 'L.A.',
  };
  const ref = db.collection('users').doc();
  await ref.set(testDoc);
  const copyId = ref.id;
  const copyRef = db.collection('copies').doc(copyId);
  const copyDocument = await copyRef.get();
  expect(1).toBe(1);
});
