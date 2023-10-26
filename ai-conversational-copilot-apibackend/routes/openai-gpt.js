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

//OpenAI API key and endpoint for GPT-3.5 Chat API
const aoai_chatgpt_35_key = config[0].aoai_chatgpt_35_key;
const aoai_chatgpt_35_endpoint = config[0].aoai_chatgpt_35_endpoint;
const aoai_chatgpt_35_deployment_name = config[0].aoai_chatgpt_35_deployment_name;
const aoai_chatgpt_35_api_version = config[0].aoai_chatgpt_35_api_version;

//OpenAI API key and endpoint for GPT-4 Chat API
const aoai_chatgpt_4_key = config[0].aoai_chatgpt_4_key;
const aoai_chatgpt_4_endpoint = config[0].aoai_chatgpt_4_endpoint;
const aoai_chatgpt_4_deployment_name = config[0].aoai_chatgpt_4_deployment_name;
const aoai_chatgpt_4_api_version = config[0].aoai_chatgpt_4_api_version;

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

//Post operation /openai/gpt/agentassist35
router.post('/gpt/agentassist35', async (req, res) => {
    const conversation_transcript = JSON.stringify(req.body.transcript);
    const requestCustomTemplate = req.body.customTemplate;
    const url = aoai_chatgpt_35_endpoint + 'openai/deployments/' + aoai_chatgpt_35_deployment_name + '/chat/completions?api-version=' + aoai_chatgpt_35_api_version;

    const messages = [
        { role: "system", content: "You are an AI assistant that goes through a list of questions provided to you and checks which the questions are answered or not answered in the provided transcript of conversation between a call center agent and customer. You should go through the entire conversation transcript, analyse given list of questions to check if those questions have been answered. Please provide output in two sections: in the first section you list the questions that are not answered or addressed. You should also list any new questions that are asked in the conversation transcripts but are not answered; put these new questions the first section along with other unanswered questions from the list. In the second section you list the questions that are already answered. Provide factual answers based on the provided conversation transcript only.  \
                                    You will be provided two things as input: 1. a list of questions and 2. call transcript. These two inputs will be contained within tripple backticks ``` \
                                    Provide output in two sections with headings 'First Section:' and 'Second Section:'. In the 'First Section:' you must include two things: 1. Unanswered questions from the list and 2. New questions asked but not answered in the conversation. In the 'Second Section:' you must include two things: 1. Answered questions from the list with corresponding answers and 2. Answered questons not in the list with corresponding answers." },
        { role: "user", content: "```" + requestCustomTemplate + "```" + " \n Below is the call transcript:\n ```" + conversation_transcript + "```"},
    ];

    const messagesold = [
        { role: "system", content: "You are an AI assistant that goes through a list of questions provided to you and checks which the questions are answered or not answered in the provided transcript of conversation between a call center agent and customer. You should go through the entire conversation transcript, analyse given list of questions and provide output in two sections. In the first section you only list the questions that are not answered or addressed. In the second section you list the questions that are already answered. Provide factual answers based on the provided conversation transcript only. You should also list any new questions that are asked in the conversation transcripts but are not answered. Those questions should be listed in the first section along with other unanswered questions. \
                                    You will be provided two things in as input: list of questions and call transcript. These two inputs will be contained within tripple backticks ``` \
                                    Provide output in two sections with headings 'First Section' and 'Second Section'. In the 'First Section' put the list of unanswered question and in the 'Second Section' put the list of answered questions" },
        { role: "user", content: "```" + requestCustomTemplate + "```" + " \n Below is the call transcript:\n ```" + conversation_transcript + "```"},
    ];

    var starttime = new Date();
    const headers = {'Content-Type': 'application/json', 'api-key': aoai_chatgpt_35_key};
    const params = {
        messages: messages,
        max_tokens: 4000,
        temperature: 0.1
    }
    try{
        const chatcompletionResponse = await axios.post(url, params, {headers: headers});
        res.send(chatcompletionResponse.data.choices[0]); 
        var endtime = new Date() - starttime;        
        writeData(req.body.transcript, requestCustomTemplate, chatcompletionResponse.data.choices[0], req.ip, "chatcompletion35-agentassist35", endtime);
    }catch(error){
        console.error('ERROR WITH AZURE OPENAI API:', error.message);
        res.send(error.message);
        writeData(req.body.transcript, requestCustomTemplate, error, req.ip, "chatcompletion35-agentassist35");
    }       
});

//Post operation /openai/gpt/agentassist4
router.post('/gpt/agentassist4', async (req, res) => {
    const conversation_transcript = JSON.stringify(req.body.transcript);
    const requestCustomTemplate = req.body.customTemplate;
    const url = aoai_chatgpt_4_endpoint + 'openai/deployments/' + aoai_chatgpt_4_deployment_name + '/chat/completions?api-version=' + aoai_chatgpt_4_api_version;

    const messages = [
        { role: "system", content: "You are an AI assistant that goes through a list of questions provided to you and checks which the questions are answered or not answered in the provided transcript of conversation between a call center agent and customer. You should go through the entire conversation transcript, analyse given list of questions to check if those questions have been answered. Please provide output in two sections: in the first section you list the questions that are not answered or addressed. You should also list any new questions that are asked in the conversation transcripts but are not answered; put these new questions the first section along with other unanswered questions from the list. In the second section you list the questions that are already answered. Provide factual answers based on the provided conversation transcript only.  \
                                    You will be provided two things as input: 1. a list of questions and 2. call transcript. These two inputs will be contained within tripple backticks ``` \
                                    Provide output in two sections with headings 'First Section:' and 'Second Section:'. In the 'First Section:' you must include two things: 1. Unanswered questions from the list and 2. New questions asked but not answered in the conversation. In the 'Second Section:' you must include two things: 1. Answered questions from the list with corresponding answers and 2. Answered questons not in the list with corresponding answers." },
        { role: "user", content: "```" + requestCustomTemplate + "```" + " \n Below is the call transcript:\n ```" + conversation_transcript + "```"},
    ];
    var starttime = new Date();
    const headers = {'Content-Type': 'application/json', 'api-key': aoai_chatgpt_4_key};
    const params = {
        messages: messages,
        max_tokens: 4000,
        temperature: 0.1
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


module.exports = router;

