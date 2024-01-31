import React, { useRef, useState, ChangeEvent, FormEvent } from 'react';    
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';    
import { useParams } from 'react-router-dom';    
import './UploadApp.css';    
import axios from 'axios'; 
  
interface RouteParams {  
    [key: string]: string | undefined;  
  }   
  
interface ImageFile extends File {  
  preview: string;  
}  
  
const UploadApp: React.FC = () => {    
  const fileInput = useRef<HTMLInputElement>(null);    
  const [message, setMessage] = useState<string>('');    
  const { prefix } = useParams<RouteParams>();  
  const [selectedImages, setSelectedImages] = useState<string[]>([]);    
    
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {    
    e.preventDefault();    
    const fileList = fileInput.current?.files;
    var storageaccount= '';
    var storagecontainer = '';  
    var sasToken = '';
    
    
    // Fetch the sasToken, storageaccount, and storagecontainer from the backend server
    try {
      const data = { blobprefix: prefix };
      const headers = { 'Content-Type': 'application/json' };
      const response = await axios.post('/data/storage/getStorageForUpload', data, { headers });
      storageaccount  = response.data.storageaccount;
      sasToken = response.data.sasToken;
      storagecontainer = response.data.storagecontainer;
    } catch (error) {    
    console.error('There was an error getting storage details for uploading files: ', error);    
    var errormsg = 'There was an error getting storage details for uploading files: ' + error;  
    setMessage(errormsg);    
  }     
    const blobServiceClient: BlobServiceClient = new BlobServiceClient(`https://${storageaccount}.blob.core.windows.net?${sasToken}`);    
    const containerClient: ContainerClient = blobServiceClient.getContainerClient(storagecontainer);    
    
    if (fileList) {  
      try {  
        for (let i = 0; i < fileList.length; i++) {    
          const blobName = `${prefix}/${prefix}-${fileList[i].name}`;   
          const blobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);             
          await blobClient.uploadData(fileList[i]);  
        }  
        var successmsg = 'Successfully uploaded '+ fileList.length + ' files for '+ prefix;  
        setMessage(successmsg) ;    
      } catch (error) {    
        console.error('There was an error uploading your files: ', error);    
        var errormsg = 'There was an error uploading your files: ' + error;  
        setMessage(errormsg);    
      }   
    }      
  };    
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {    
    const files = Array.from(e.target.files || []);    
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));    
    const urls = imageFiles.map((file) => URL.createObjectURL(file));    
    setSelectedImages(urls);    
  };  
    
  return (    
    <div className="UploadApp">   
      <header className="App-header">    
        <h3>Case Management</h3>  
        <p></p>
        <p className="photo-collection">Please upload photos (max 3)</p>     
      </header>   
      <div className="App-body">    
        <p>Limited to 3 images for this app (GPTV supports more)</p>
        <form onSubmit={onFormSubmit}>    
          <input type="file" ref={fileInput} onChange={handleFileChange} multiple />    
          <div className="image-preview">    
            {selectedImages.map((src, index) => (    
              <img key={index} src={src} alt="" />    
            ))}    
          </div>   
          <button type="submit">Upload photos</button>    
        </form>    
        {message && <p>{message}</p>}    
      </div>   
        
    </div>    
  );    
}    
    
export default UploadApp;  
