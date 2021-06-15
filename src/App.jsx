import './App.css';
import Amplify, {API, graphqlOperation, Storage} from 'aws-amplify';
import awsconfig from './aws-exports'
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react'
import {listSongs} from './graphql/queries'
import {updateSong} from './graphql/mutations'
import {useState, useEffect} from 'react'
import {Paper, IconButton} from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import FavoriteIcon from '@material-ui/icons/Favorite';
import Modal from './components/modal/Modal'
import ReactPlayer from 'react-player'

Amplify.configure(awsconfig)
function App() {

  const [show, setShow] = useState(false);
  const [songs, setSongs] = useState([]);
  const [songPlaying, setSongPlaying] = useState("");
  const [audioURL, setaudioURL] = useState("");
  const reload=()=>window.location.reload();
  // every time this page fetch, fetchSongs will fetch too 
  useEffect(()=>{
    fetchSongs()
  }, []);

  const toggleSong = async idx =>{
    if(songPlaying === idx){
      setSongPlaying(' ')
      return
    }

    const playingSongFilePath = songs[idx].filePath;
    try{
      const fileAccessURL = await Storage.get(playingSongFilePath, {expires: 120});
      console.log(fileAccessURL)
      setaudioURL(fileAccessURL)
      setSongPlaying(idx);

      return
    }catch(e){
      console.log(e.message)
      setaudioURL(" ");
      setSongPlaying(" ");
      return e.message
    }
  }
  const fetchSongs = async () =>{
    try{
      // getting all data from the backend
      const songData = await API.graphql(graphqlOperation(listSongs))
      // getting just the info
      const songList = songData.data.listSongs.items
      console.log(songList)
      // setting the array of song list
      setSongs(songList)
      
    }catch(e){
      console.log("error on fetching songs",e)
    }
  }

  const addLike = async(idx)=> {
    try{
      const song = songs[idx];
      song.like = song.like +1;
      delete song.createdAt;
      delete song.updatedAt;

      const songData = await API.graphql(graphqlOperation(updateSong, {input: song})) 
      // updating song list
      const songList = [...songs];
      songList[idx] = songData.data.updateSong;
      setSongs(songList)

    }catch(e){
      console.log("error in add like",e)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
      <AmplifySignOut/>
      <h2>My App Account</h2>
       <div className="App">
      <button onClick={() => setShow(true)}>Add You Song</button>
      <Modal title="My Modal" onClose={() => setShow(false)} show={show} onExit={reload}>
      </Modal>
    </div>
      </header>
      <div className="songList">
        {songs.map((song, idx) =>{
          return <Paper variant="outlined" elevation={2} key={`song${idx}`}>
              <div className="songCard">
              <IconButton arial-label="play" onClick={() => toggleSong(idx)}>
                {songPlaying === idx? <PauseCircleOutlineIcon/>: <PlayArrowIcon />}
              </IconButton>
              <div>
                <div className="songTitle">{song.title} </div>
                <div className="songOwner">{song.owner} </div>
              </div>
              <div>
                <IconButton arial-label="like" onClick={() =>addLike(idx)}>
                  <FavoriteIcon />
                </IconButton>
                {song.like}
              </div>
              <div className="songDescription">{song.description}</div>
              </div>
              {
                songPlaying === idx ? (
                  <div className="audioPlayer">
                    <ReactPlayer url={audioURL} controls playing height="50px" 
                    onPause={() => toggleSong(idx)}
                    />
                  </div>
                ):null
              }
            </Paper>;
        })}
      </div>
    </div>
  );
}

export default withAuthenticator(App);
