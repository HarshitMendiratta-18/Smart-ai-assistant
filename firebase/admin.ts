import * as admin from 'firebase-admin';

export const isAdminMockMode =
  !process.env.FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID.startsWith('mock') ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  process.env.FIREBASE_PRIVATE_KEY.startsWith('mock');

let dbAdmin: any = null;
let authAdmin: any = null;

if (!isAdminMockMode) {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed. Falling back to Server Mock Mode.", error);
  }
}

export { admin, dbAdmin, authAdmin };
export type AdminFirestore = typeof dbAdmin;
export type AdminAuth = typeof authAdmin;
