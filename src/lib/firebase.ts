/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
// Import analytics only if you're going to use it
// import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDt4PylNCB1sbeof2VzwU5DHaf5LfQHu6I",
  authDomain: "git-helper-4a125.firebaseapp.com",
  projectId: "git-helper-4a125",
  storageBucket: "git-helper-4a125.firebasestorage.app", // Fixed the storage bucket URL
  messagingSenderId: "789513178567",
  appId: "1:789513178567:web:cd1afb6ba6555beb429de2",
  measurementId: "G-D70VCHT6RV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export what you need
export const storage = getStorage(app);

// Only initialize analytics if you need it
// const analytics = getAnalytics(app);

export async function uploadFile(file: File, setProgress?: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, `meetings/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (setProgress) setProgress(progress);
          
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.error('Upload failed:', error.code, error.message);
          reject(new Error(`Upload failed: ${error.code} - ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            resolve(downloadURL as string);
          } catch (err) {
            console.error('Failed to get download URL:', err);
            reject(new Error('Failed to get download URL'));
          }
        }
      );
    } catch (err) {
      console.error('Unexpected upload error:', err);
      reject(new Error('Unexpected upload error'));
    }
  });
}

export default app; // Export the app instance for use in other components