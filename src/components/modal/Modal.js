import React, { useEffect, useState, useReducer } from "react";
import {createSong} from '../../graphql/mutations'
import {API, graphqlOperation, Storage} from 'aws-amplify';
import { CSSTransition } from "react-transition-group";
import ReactDOM from "react-dom";
import './Modal.css';
import { v4 as uuidv4 } from 'uuid';


const formReducer = (state, event) => {

 return {
   ...state,
   [event.name]: event.value
 }
}

const Modal = props => {
  const closeOnEscapeKeyDown = e => {
    if ((e.charCode || e.keyCode) === 27) {
      props.onClose();
    }
  };

  useEffect(() => {
    document.body.addEventListener("keydown", closeOnEscapeKeyDown);
    return function cleanup() {
      document.body.removeEventListener("keydown", closeOnEscapeKeyDown);
    };
  }, []);


  const [formData, setFormData] = useReducer(formReducer, {});
  const [submitting, setSubmitting] = useState(false);
    const [sendMp3Data, setMp3Data] = useState();

    const handleSubmit = async(event) => {
      event.preventDefault();
      setSubmitting(true);

     const {name} = sendMp3Data
      const file = `${uuidv4()}-${name}`
      const storageS3 = await Storage.put(file, sendMp3Data,{contentType: 'audio/mp3'})
      console.log(storageS3)
      console.log(file)
      const newformData ={
        ...formData,
        filePath: file,
        like: 0,
      }
      console.log(newformData)
      await API.graphql(graphqlOperation(createSong, {input: newformData})) 

   setTimeout(() => {
     setSubmitting(false);
   }, 2000)
  }



  const handleChange = event => {
    setFormData({
      name: event.target.name,
      value: event.target.value,
    });
    }
  return ReactDOM.createPortal(
    <CSSTransition
      in={props.show}
      unmountOnExit
      timeout={{ enter: 0, exit: 300 }}
    >
      <div className="modal" onClick={props.onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h4 className="modal-title">{props.title}</h4>
               <button onClick={props.onClose} className="button close">
              Close
            </button>
          </div>
          <div className="modal-body">
            {submitting &&   
            <div>Submtting Form...</div>
            }
        <form onSubmit={handleSubmit}>
          <fieldset>
            <div className="name-owner">
              <label>
                <p>Title</p>
                <input name="title"onChange={handleChange} required />
              </label>
              <label>
                <p>owner</p>
                <input name="owner" onChange={handleChange} required />
              </label>
            </div>
            <label>
              <p>description</p>
              <input name="description" onChange={handleChange} required />
            </label>
            <label>
              <p>Upload File</p>
              <input type="file" accept="audio/mp3" onChange={e => setMp3Data(e.target.files[0])} required />
            </label>
          </fieldset>
          <button type="submit" disabled={!formData & !sendMp3Data}>Submit</button>
          </form>
      </div>
        </div>
      </div>
    </CSSTransition>,
    document.getElementById("root")
  );
};

export default Modal;