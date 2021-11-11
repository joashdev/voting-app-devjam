//local files
import firebaseConfig from './config';
import logo from './images/vot.png';
import './App.css';

// firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

//  react
// import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  // for App
  // for auth
  const [user, setUser] = useState(null);
  useEffect(() => {
    auth.onAuthStateChanged(user => {
      setUser(user);
    });
  });
  // for selected poll
  const [pollIndex, setPollIndex] = useState(null);
  const selectedPoll = selectedIndex => {
    setPollIndex(selectedIndex);
  };
  // for Polls
  const pollsRef = firestore.collection('polls');
  const query = pollsRef.limit(25);
  const [polls] = useCollectionData(query, { idField: 'id' });

  return (
    <Router>
      <div className="App hero is-info is-fullheight">
        <Navbar user={user} />
        <div class="hero-body p-0 pt-3 is-flex-direction-column">
          <Routes>
            <Route
              path="/"
              element={
                <Polls user={user} polls={polls} selectedPoll={selectedPoll} />
              }
            ></Route>
            <Route
              path="/poll"
              element={<Poll user={user} polls={polls} pollIndex={pollIndex} />}
            ></Route>
            {/* <Route path="/signin" element={<SignInModal />}></Route> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Polls({ user, polls, selectedPoll }) {
  let navigate = useNavigate();
  const handleSelected = e => {
    selectedPoll(e.target.value);
    // console.log("Target value: ", e.target.value)
    navigate('/poll');
  };
  // console.log('Polls', polls);

  return (
    <>
      <div class="mb-3 has-text-centered">
        <p class="title">The Voting App</p>
        <p class="subtitle">The largest collection of random polls</p>
      </div>
      <div class="columns is-centered">
        <div class="column is-10">
          <div class="columns is-multiline is-centered">
            {polls &&
              polls.map((poll, index) => (
                <div class="column is-one-third" key={poll.id}>
                  <div class="card is-flex is-flex-direction-column">
                    <div class="card-image">
                      <figure class="image is-3x2">
                        <img src={poll.imgURL} alt="Poll Header" />
                      </figure>
                    </div>
                    <div class="card-content">
                      <p class="is-size-6 has-text-centered has-text-weight-bold">
                        {poll.name}
                      </p>
                      <p class="is-size-7">{poll.description}</p>
                    </div>
                    <div class="card-footer mt-auto">
                      <button
                        class="card-footer-item button px-0 mx-3 is-info is-inverted has-text-weight-bold"
                        value={index}
                        onClick={handleSelected}
                      >
                        Vote →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Poll({ user, polls, pollIndex }) {
  let navigate = useNavigate();
  // update document upon click
  // eslint-disable-next-line
  const updateFirestoreDoc = e => {
    !user
      ? // ? navigate('/signin')
        signInWithGoogle()
      : firestore
          .collection('polls')
          .doc(polls[pollIndex].id)
          .update({
            voters: [
              ...polls[pollIndex].voters,
              {
                userid: auth.currentUser.uid,
                vote: parseInt(e.target.value)
              }
            ]
          });
  };
  const getUserVote = () => {
    return polls[pollIndex].voters.filter(voter => voter.userid === user.uid);
  };
  const votePercentage = () => {
    const totalVotes = polls[pollIndex].voters.length;
    const options = Array(polls[pollIndex].options.length).fill(0);
    polls[pollIndex].voters.forEach(voter => {
      options[voter.vote]++;
    });
    return options.map(option => {
      return `${((option / totalVotes) * 100).toFixed()}%`;
    });
  };
  return (
    <div>
      <div class="mb-1 has-text-centered">
        <p class="title">{polls[pollIndex].name}</p>
        <p class="subtitle is-6">{polls[pollIndex].description}</p>
      </div>
      <div className="columns-is-centered">
        <div className="card column">
          <div className="card-image">
            <figure className="image is-3x2">
              <img src={polls[pollIndex].imgURL} alt="Poll Header" />
            </figure>
          </div>
          <div className="card-content p-2">
            {!polls[pollIndex].voters.some(voter => {
              return voter.userid === user?.uid;
            })
              ? polls[pollIndex].options.map((option, index) => (
                  <button
                    className="button my-1 is-outlined is-fullwidth is-rounded is-info has-text-weight-bold"
                    value={index}
                    key={index}
                    onClick={updateFirestoreDoc}
                  >
                    {option}
                  </button>
                ))
              : polls[pollIndex].options.map((option, index) => (
                  <div
                    className="button is-justify-content-start is-fullwidth my-1 p-0"
                    key={index}
                    
                  >
                    <div
                      className={getUserVote()[0].vote===index? "has-background-info": "has-background-grey"}
                      style={{ width: votePercentage()[index], height: '100%' }}
                    >
                    </div>
                    <span class="p-2 left is-7">{option}</span>
                    <span class="p-2 right">{votePercentage()[index]}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
      <button
        class="button my-3 is-info is-inverted bd-pagination-prev"
        onClick={() => {
          navigate('/');
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}

// function SignInModal() {
//   // let navigate = useNavigate();
//   const closeModal = () => {
//     const signinModal = document.getElementById('signinModal');
//     signinModal.classList.remove('is-active');
//     // nextPath ? navigate(nextPath, { state: { pollId: pollId } }) : navigate('/');
//     // navigate('/');
//   };
//   return (
//     <div class={'modal is-active'} id="signinModal">
//       <div class="modal-background"></div>
//       <div class="modal-card">
//         <header class="modal-card-head">
//           <p class="modal-card-title">Sign in to vote</p>
//           <button
//             class="delete"
//             aria-label="close"
//             onClick={closeModal}
//           ></button>
//         </header>
//         <section class="modal-card-body is-flex is-justify-content-center">
//           <SignIn/>
//         </section>
//       </div>
//     </div>
//   );
// }

function Navbar({ user }) {
  return (
    <div class="hero-head">
      <header class="navbar">
        <div class="container is-flex is-fullwidth is-justify-content-space-between is-align-items-center">
          <a class="navbar-item" href="/">
            <img src={logo} alt="Logo" />
          </a>
          {user ? <SignOut user={user} /> : <SignIn />}
        </div>
      </header>
    </div>
  );
}
// for SignIn
const signInWithGoogle = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

// eslint-disable-next-line
function SignIn() {
  return (
    <span class="navbar-item">
      <button class="button is-info is-inverted" onClick={signInWithGoogle}>
        <span class="icon">
          <i class="fab fa-google"></i>
        </span>
        <span>Sign in with Google</span>
      </button>
    </span>
  );
}
// eslint-disable-next-line
function SignOut() {
  let navigate = useNavigate();
  return (
    <span class="navbar-item">
      <button
        className="button is-info is-inverted"
        onClick={() => {
          auth.signOut();
          navigate('/');
        }}
      >
        <span class="icon">
          <figure className="image is-1x1">
            <img
              class="is-rounded"
              src={auth.currentUser.photoURL}
              alt="User Profile"
            />
          </figure>
        </span>
        <span>Sign-out</span>
      </button>
    </span>
  );
}

export default App;
