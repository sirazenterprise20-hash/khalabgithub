import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";

// The Web App's Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAUKXbdTbx138JmZUk1oR34Lt9vkabm7YI",
  authDomain: "testkhalab.firebaseapp.com",
  projectId: "testkhalab",
  storageBucket: "testkhalab.firebasestorage.app",
  messagingSenderId: "779766922472",
  appId: "1:779766922472:web:8622d61456a404ba375d5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Validate Connection to Firestore on startup (required by skill rules)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or connectivity.");
    }
  }
}
testConnection();

// --- Error Handler Helper ---
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Hooked: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Dynamic Phone Auth Simulation & Operations ---
/**
 * Automatically creates/signs-in a Firebase Auth user based deterministically
 * on their phone number, and inserts their profile details into Firestore under /users/{uid}.
 */
export async function autoSignInAndRegisterByPhone(
  phoneNumber: string,
  fullName: string,
  address: string,
  city: string
): Promise<FirebaseUser> {
  const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, "");
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error("Invalid phone number format for auto auth");
  }

  const email = `phone_${cleanPhone}@khalab.com`;
  const password = `khalab_pwd_${cleanPhone}`;

  let user: FirebaseUser;

  try {
    // 1. Try signing in
    const credential = await signInWithEmailAndPassword(auth, email, password);
    user = credential.user;
    console.log("Logged in existing user session for phone:", phoneNumber);
  } catch (err: any) {
    // If user does not exist, create a new one
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
        console.log("Registered new user session for phone:", phoneNumber);
      } catch (createErr) {
        console.error("Failed to create user with phone email, trying secondary credential fallback", createErr);
        throw createErr;
      }
    } else {
      console.error("Auth sign in failed:", err);
      throw err;
    }
  }

  // 2. Save customer profile document in Firestore (under users collect / user's authentic UID)
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      fullName,
      phoneNumber,
      address,
      city,
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("Successfully synchronized user profile in Firestore");
  } catch (firestoreErr) {
    handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${user.uid}`);
  }

  return user;
}

/**
 * Stores details of a finished order inside Firestore.
 */
export async function storeOrderInFirestore(order: any, userId: string) {
  try {
    const orderDocRef = doc(db, "orders", order.id);
    await setDoc(orderDocRef, {
      ...order,
      userId,
      syncedAt: new Date().toISOString()
    });
    console.log(`Uploaded copy of Order ${order.id} to Firestore`);
  } catch (firestoreErr) {
    handleFirestoreError(firestoreErr, OperationType.WRITE, `orders/${order.id}`);
  }
}

/**
 * Retrieves list of orders placed by the currently logged-in user from Firestore.
 */
export async function getUserOrdersFromFirestore(userId: string): Promise<any[]> {
  const ordersPath = "orders";
  try {
    const q = query(collection(db, ordersPath), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const orderList: any[] = [];
    querySnapshot.forEach((docSnap) => {
      orderList.push({ id: docSnap.id, ...docSnap.data() });
    });
    return orderList;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ordersPath);
    return [];
  }
}
