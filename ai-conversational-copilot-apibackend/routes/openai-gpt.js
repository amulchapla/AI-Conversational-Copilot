// Express routes for the OpenAI GPT-3 API
const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config.json');
const openaiconfig = require('./openai-config.json');
const { writeData, updateData } = require('../data/data-logging.js')

//OpenAI API key and endpoint for GPT 3.5 completion API
const openaiKey = config[0].openai_key;
const openaiEndpoint = config[0].openai_endpoint;
const openaiDeploymentName = config[0].openai_deployment_name;

//OpenAI API key and endpoint for GPT-4 Chat API
const aoai_chatgpt_4_key = config[0].aoai_chatgpt_4_key;
const aoai_chatgpt_4_endpoint = config[0].aoai_chatgpt_4_endpoint;
const aoai_chatgpt_4_deployment_name = config[0].aoai_chatgpt_4_deployment_name;
const aoai_chatgpt_4_api_version = config[0].aoai_chatgpt_4_api_version;

//OpenAI API key and endpoint for GPT-V API
const aoai_gptv_key = config[0].gptv_key;
const aoai_gptv_endpoint = config[0].gptv_endpoint;

//Set up OpenAI GPT-3 parameters
const openaiMaxTokens = openaiconfig[0].openai_max_tokens;
const openaiTemperature = openaiconfig[0].openai_temperature;
const openaiTopP = openaiconfig[0].openai_top_p;
const openaiFrequencyPenalty = openaiconfig[0].openai_frequency_penalty;
const openaiPresencePenalty = openaiconfig[0].openai_presence_penalty;
const openaiApiVersion = openaiconfig[0].openai_api_version;

router.get('/gpt/sayhello', async (req, res) => {
    const currentDateTime = new Date();    
    res.send('Hello World from the OpenAI GPT backend! ' + currentDateTime)
});

router.post('/gpt/customPrompt', async (req, res) => {
    const requestText = JSON.stringify(req.body.transcript);
    const requestCustomPrompt = req.body.customPrompt;
    const customParsePrompt = requestText + "\n\n" + requestCustomPrompt;
    const url = openaiEndpoint + 'openai/deployments/' + openaiDeploymentName + '/completions?api-version=' + openaiApiVersion;
    const headers = {'Content-Type': 'application/json', 'api-key': openaiKey};
    var starttime = new Date();
    const params = {
        "prompt": customParsePrompt,
        "max_tokens": 1000,
        "temperature": openaiTemperature,
        "top_p": openaiTopP,
        "frequency_penalty": openaiFrequencyPenalty,
        "presence_penalty": openaiPresencePenalty
    }
    try{
        const completionResponse = await axios.post(url, params, {headers: headers});
        res.send(completionResponse.data.choices[0]);   
        var endtime = new Date() - starttime;              
        writeData(req.body.transcript, requestCustomPrompt, completionResponse.data.choices[0], req.ip, "completion35-customPrompt", endtime)
    }catch(error){
        console.error('ERROR WITH AZURE OPENAI API:', error.message);
        res.send(error.message)
        writeData(req.body.transcript, requestCustomPrompt, error, req.ip, "completion35-customPrompt")
    }       
});

//Post operation /openai/gpt/agentassist4
router.post('/gpt/liveguidance', async (req, res) => {
    const conversation_transcript = JSON.stringify(req.body.transcript);
    const requestCustomTemplate = req.body.customTemplate;
    const url = aoai_chatgpt_4_endpoint + 'openai/deployments/' + aoai_chatgpt_4_deployment_name + '/chat/completions?api-version=' + aoai_chatgpt_4_api_version;

    const system_content = `ROLE: You are an AI assistant that goes through a list of questions provided to you and checks which the questions are answered or not answered in the provided transcript of conversation between a call center agent and customer. 
    TASK: You should go through the entire conversation transcript, analyze given list of questions, imply what you need to from the transcript, and guess if those questions have been answered or addressed. Please provide output in two sections: in the first section list the questions that are already answered. In the second section list the questions that are not answered or addressed.  
    QUESTIONS:
    ${requestCustomTemplate}
    USER FORMAT:
    <TRANSCRIPT>
    ...
    <GO>
    ASSISTANT FORMAT:
    Addressed Questions
    <Question Number>. <Question> - <Answer>
    Unaddressed Questions
    <Question Number>. <Question>
    CONSTRAINT: if the answer can be inferred from the transcript, consider the question addressed
    CONSTRAINT: if the customer says anything in relation to the question, consider the question addressed
    CONSTRAINT: answers should use as few words as possible and no longer than 1 sentence.`

    const messages = [
        { role: "system", content: system_content },
        { role: "user", content: "\n<TRANSCRIPT>\n" + conversation_transcript + "<GO>"},
    ];
    var starttime = new Date();
    const headers = {'Content-Type': 'application/json', 'api-key': aoai_chatgpt_4_key};
    const params = {
        messages: messages,
        max_tokens: 4000,
        temperature: 0
    }
    try{
        const chatcompletionResponse = await axios.post(url, params, {headers: headers});
        res.send(chatcompletionResponse.data.choices[0]); 
        var endtime = new Date() - starttime;         
        writeData(req.body.transcript, requestCustomTemplate, chatcompletionResponse.data.choices[0], req.ip, "chatcompletion4-agentassist4", endtime);
    }catch(error){
        console.error('ERROR WITH AZURE OPENAI API:', error.message);
        res.send(error.message);
        writeData(req.body.transcript, requestCustomTemplate, error, req.ip, "chatcompletion4-agentassist4");
    }       
});

//Post operation /gptv/imageinsights  
router.post('/gptv/imageinsights', async (req, res) => {  
    const GPTV_KEY = aoai_gptv_key;    
    const GPTV_ENDPOINT = aoai_gptv_endpoint;    
      
    const PROMPT_USER = "<GO>"  ;
    
    const PROMPT_SYSTEM =`You are an AI assistant that helps people find information
    Vehicles in images are US vehicles with driver sitting left facing forward.
    When the user says '<GO>', Identify all the cars in all images, for each photo if it contains a vehicle, list its damages in the following format
    <FORMAT>
    Photo_Insights <number>: 
    PHOTO DESCRIPTION: Provide a short description of the image along with key insights. 
    VEHICLE DESCRIPTION: <GIVE YOUR BEST GUESS OF THE FOLLOWING, USE PROPER NAMES, color, make, model> 
    COLLISION DAMAGE VISIBLE: <only if it's the vehicle in the photo has been in a major collision accident, true or false>
    DAMAGED PARTS: <only if collision damage is visible, damage parts, use driver/passenger side>
    DAMAGED ZONES: <only if collision damage is visible,list of damage zones, select from Passenger side front, Passenger side front fender, Passenger side mid-section, Passenger side rear panel, Passenger side rear, Rear, Front, Roof, Undercarriage, Driver side rear, Driver side rear panel, Driver side mid-section, Driver side front, Driver side front fender    >
    POINT OF IMPACT ZONES: <only if there are damage zones, point of impact, select the most damaged zone from damage part zones>
    AIRBAGS DEPLOYED: <DETECTION OF ANY WHITE BLOB VISIBLE THROUGH THE WINDOWS IN THE PHOTO THAT MIGHT BE AIRBAGS. IF WINDOWS ARE NOT OPAQUE ASSUME YOU CAN SEE THE INTERIOR TO DETERMINE THIS VALUE, true or false>
    </FORMAT>
    if the value of a field is not available do not include it.
    if a photo does not contain a vehicle just give a description and mention that photo does not contain a vehicle.`

    const images = req.body; // Array of image objects  
    var starttime = new Date();
    const imagesToProcess = images.slice(0, 3);  
    console.log("GPTV insights processing request");
    // Fetch all images and encode to base64  
    const encodedImagesPromises = imagesToProcess.map(async imageObj => {  
        const IMAGE_PATH = imageObj.sasUrl;  
  
        // Fetch the image from Azure Storage    
        let responseImage;    
        try {    
            responseImage = await axios.get(IMAGE_PATH, {    
                responseType: 'arraybuffer' // Response type for binary data    
            });    
        } catch (error) {    
            console.error(`Failed to fetch image: ${error}`);    
            res.send(`Failed to fetch image: ${error}`);    
            return;    
        }    
  
        // Encode the image to base64    
        return Buffer.from(responseImage.data, 'binary').toString('base64');  
    });  
  
    // Resolve all promises  
    const encodedImages = await Promise.all(encodedImagesPromises);  
  
    const headers = {  
        "Content-Type": "application/json",  
        "api-key": GPTV_KEY,  
    };  
      
    const payload = {  
        "messages": [  
            {  
                "role": "system",  
                "content": PROMPT_SYSTEM
            },  
            {  
                "role": "user",  
                "content": [  
                    ...encodedImages.map(encodedImage => ({ image: encodedImage })),  
                    PROMPT_USER  
                ]  
            }
        ],  
        "temperature": 0,  
        "top_p": 0.95,  
        "max_tokens": 2500  
    };       
    
    try {  
        const response = await axios.post(GPTV_ENDPOINT, payload, { headers: headers });  
        // Extract the content string  
        const contentStr = response.data.choices[0].message.content;  
  
        // Split the content string into separate insights  
        const insights = contentStr.split('Photo_Insights ').slice(1); // Remove first empty string  
        //console.log("GPTV insight: ", insights)
  
        // Construct the final response array  
        const finalResponse = imagesToProcess.map((imageObj, i) => {  
            return {  
                name: imageObj.name,  
                sasUrl: imageObj.sasUrl,  
                imageInsights: insights[i]  
            };  
        });  
  
        res.send(finalResponse);
        var endtime = new Date() - starttime;
        //console.log("GPTV insights processed in time: ", endtime);
        writeData("Image names", PROMPT_SYSTEM, finalResponse, req.ip, "gptv-imageinsights", endtime);
    } catch (error) {  
        console.error(`Failed to post data: ${error}`);  
        res.send(`Failed to post data: ${error}`);  
        writeData(req.body, PROMPT_SYSTEM, error, req.ip, "gptv-imageinsights");
    }  
});  




module.exports = router;

