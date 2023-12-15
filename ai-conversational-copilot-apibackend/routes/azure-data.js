// Express routes for Azure data service including Blob storage and Cosmos
const express = require('express');  
const router = express.Router();  
const config = require('../config.json');
const { BlobServiceClient } = require("@azure/storage-blob");  
const { generateBlobSASQueryParameters, BlobSASPermissions } = require("@azure/storage-blob");  
  
const azure_storage_connection_string = config[0].azure_storage_connection_string;
const azure_storage_container_name = config[0].azure_storage_container_name;
const azure_storage_account_name = config[0].azure_storage_account_name;

router.post('/storage/listBlobs', async (req, res) => {  
    const blobServiceClient = BlobServiceClient.fromConnectionString(azure_storage_connection_string);  
    const containerName = azure_storage_container_name; //req.body.containerName  
    const prefix = req.body.blobprefix; // get prefix from request body  
    const containerClient = blobServiceClient.getContainerClient(containerName);  
    let blobsList = [];  
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {  
        const blobClient = containerClient.getBlobClient(blob.name);  
        const blobSAS = generateBlobSASQueryParameters({  
            containerName,  
            blobName: blob.name,  
            permissions: BlobSASPermissions.parse("r"), // read permission  
            startsOn: new Date(),  
            expiresOn: new Date(new Date().valueOf() + 7200000) // SAS token valid for 2 hours  
        }, blobServiceClient.credential).toString();
        const sasUrl = blobClient.url + "?" + blobSAS;    
        blobsList.push({ name: blob.name, sasUrl: sasUrl, imageInsights: 'In progress'});  
    }  
    res.json(blobsList);  
    //console.log("Returned sasUrls for : ", prefix, blobsList);
});  

router.post('/storage/getStorageForUpload', (req, res) => {    
    const blobprefix = req.body.blobprefix;
    const storageaccount = azure_storage_account_name;
    const storagecontainer = azure_storage_container_name;
    const blobServiceClient = BlobServiceClient.fromConnectionString(azure_storage_connection_string);  

    try {
        const blobSAS = generateBlobSASQueryParameters({  
            containerName: storagecontainer,  
            permissions: 'rwac', // read write create permission  
            startsOn: new Date(),  
            expiresOn: new Date(new Date().valueOf() + 7200000) // SAS token valid for 2 hours  
        }, blobServiceClient.credential).toString();
    
        //const sasToken = '?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwlacupitfx&se=2023-12-01T03:20:01Z&st=2023-10-27T18:20:01Z&spr=https&sig=jQYPybn7zqFdL%2Bp2Wn371tdNtWw5i%2B35YVB10Wah05I%3D';  
        const sasToken = `?${blobSAS}`;
        res.json({ sasToken, storageaccount, storagecontainer });
        //console.log("Returned storage details for getStorageForUpload", blobprefix);
    } catch(error){
        console.error('Error getting sas token in getStorageForUpload:', error.message);
        res.send(error.message)
    }        
});
  
module.exports = router;  
