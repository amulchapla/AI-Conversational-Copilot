# Azure AI (including Azure OpenAI) - powered Conversational Copilot

AI powered Conversational copilot is a web-based app that enables you to simulate Agent-Customer interactions (in any line of business) and shows the power of Azure AI to augment the human and acts as a very effective copilot. App uses Azure Speech, Azure OpenAI GPT-4 and other AI capabilities to power the copilot experience.

This solution component provides real-time transcription and analysis of a call to improve the customer experience by exctracting custom business insights and providing real-time conversation assistance. This solution can help with agent-assist and virtual agents use cases. Key technical components of this part of the accelerator are:
    * Transcription of live audio stream using Azure Speech Service
    * Entity extraction + PII detection and redaction using Azure Language Service
    * Real-time conversation analysis (against desired conversation template) to provide live agent assistance/coaching
    * Conversation summarization using Azure OpenAI Service
    * Extract business insights & conversation details using Azure OpenAI Service

This sample simulates call center intelligence in real-time using Azure AI services. It uses Azure Speech SDK to capture audio from a microphone and convert it to text. The text is then sent to Azure Language service to extract entities, key phrases, and detect+ redact PII information. The data is then displayed in a web page in real-time using streaming pattern.

In parallel, transcript text is sent to Azure OpenAI service to perform live analysis of the conversation and provide real-time guidance to the agent. This could be useful for agent coaching, compliance, upsell and other use cases. Live insights are presented to the agent's UI so it can be used to better serve customer.

Once the call is completed, the transcript is sent to Azure OpenAI service to summarize the call. Azure OpenAI service is also used to parse raw call transcript and extract key business information using domain specific prompts. The data is then displayed in a web page UI.



This sample shows design pattern examples for authentication token exchange and management, as well as capturing audio from a microphone for speech-to-text conversions.

Below diagram depicts key components and API/communication used in this sample
<img src="common/images/ai-conversation-copilot-techarch.png" align="center" />

This sample uses Express.js backend framework which allows you to make http calls from any front end. ReactJS is used for frontend app. *NOTE*: This sample is only using the Azure Speech SDK - it does not use Azure Bot Service and Direct Line Speech channel.

* **ai-conversational-copilot-apibackend**: `ai-conversational-copilot-apibackend` is an Express-based backend API app. Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It facilitates the rapid development of Node based web applications.

* **ai-conversational-copilot-webfrontend**: `ai-conversational-copilot-webfrontend` is a React-based web UI. React.js often referred to as React or ReactJS is a JavaScript library responsible for building a hierarchy of UI components or in other words, responsible for the rendering of UI components. It provides support for both frontend and server-side.

## Prerequisites

1. This article assumes that you have an Azure account. If you don't have an Azure account and subscription, [try the Azure account for free](https://azure.microsoft.com/en-us/free/search/).
2. Create a [Azure Speech resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) in the Azure portal.
3. Create a [Azure Language resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextAnalytics) in the Azure portal.
4. Create a [Azure OpenAI resource](https://portal.azure.com/?microsoft_azure_marketplace_ItemHideKey=microsoft_openai_tip#create/Microsoft.CognitiveServicesOpenAI?WT.mc_id=academic-84928-cacaste) in the Azure portal. Note: OpenAI is currently in preview and is not available in all regions. You can check the [OpenAI documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/overview?WT.mc_id=academic-84928-cacaste) for more information. This app is using Azure OpenAI Completion API and Chat API. So you will need to create model deployments for completion API and Chat API.
5. Install [Node.js](https://nodejs.org/en/download/) on your laptop to run the frontend and backend apps on your local machine.

## How to Setup and Run this real-time solution component

1. Clone this repo. This repo has two apps as shown in the architecture diagram above: 
    * ai-conversational-copilot-webfrontend folder is for the "ReactJS Frontend" web UI component and
    * ai-conversational-copilot-apibackend folder is for the "ExpressJS Backend" API backend component 


2. **Prepare and run the backend app (in folder ai-app-backend)**
    -	Go to ai-conversational-copilot-apibackend directory and run `npm install -all` to install dependencies.
    -   Rename config_template.json to config.json
    -	Update the “config.json” file with your Azure Speech service key (speech_subscription_key property) and Azure region (speech_region property). Azure Region value examples: “eastus2”, “westus”
    -	Update the “config.json” file with your Azure Language service key (text_analytics_key property) and endpoint (text_analytics_endpoint property). 
    -	Update the “config.json” file with your Azure OpenAI service key (openai_key property), endpoint (openai_endpoint property) and deployment name (openai_deployment_name property). These settings are associated with OpenAI completion API.
    -	Update the “config.json” file with your Azure OpenAI service Chat API model deployment information. NOTE: This app gives you an option to use GPT 3.5 or GPT-4 Chat API. So you only need one model deployment access to use this app. Also, Chat API is used only for copilot functionality. So if you do not enable copilot from the web UI settings then you do not need to configure Chat API settings in this config.json file
    -   Start backend AI API app by running `‘npm start’`
    -	If you are running this locally then try accessing below URLs from browser to verify that the backend component is working as expected
        *	`http://localhost:8080/api/sayhello`
        *	`http://localhost:8080/api/get-speech-token`
    -	If you have deployed ai-app-backend app to Azure App Service (as per instructions below) then you can verify using URLs from browser as below:
        *	`https://<<your backend Azure App service name>>/api/sayhello`
        *	`https://<<your backend Azure App service name>>/api/get-speech-token`
3.	**Prepare and run the frontend app for web UI (in folder web-app-frontend)**
    +	Go to ai-conversational-copilot-webfrontend directory and run `npm install -all` to install dependencies.
    +	Update “src/main.tsx” as following. Set value of “axios.defaults.baseURL” depending on where your ai-conversational-copilot-apibackend is running. 
        +	If “ai-conversational-copilot-apibackend” is running on local machine then use `axios.defaults.baseURL = 'http://localhost:8080';`
        +	If “ai-conversational-copilot-apibackend” is running on Azure. Use `axios.defaults.baseURL = 'https://<appname>.azurewebsites.net';`
    +   Start frontend web app by running `‘npm start’`. If you get port confict with port 8080 then update package.json file to use any other port (Eg: 8081)
    +	Open a browser and go to `http://localhost:8081` to access the app. 
    +   Click on the "START Converstation" button on the web page and start talking. You should see transcription displayed on the web page in real-time (an example shown below). You can change spoken language under "Settings". Note that Copilot is disabled by default. Output below is with copilot disabled

    <img src="common/images/sampleoutput-copilot-disabled.png " align="center" />

    + Remember to click on "END Conversation" to stop live transcription and insights.


    +	If you have also deployed the ai-conversational-copilot-webfrontend to Azure App Service then use the deployed app service URL which you can find on Azure portal for your App Service. Example: `https://myweb-app-frontend.azurewebsites.net`

## How to use Conversational Copilot

1. Configure copilot settings: 
    * This app is designed to support conversations for any business scenario. The goal of the copilot is to assist with conversation template for a given conversation scenario. 
    * To use the copilot, go to "Settings" and then "Enable Copilot"
    * When you enable copilot, you need to provide a conversation template (see an example below).
    * Copilot can use GPT 3.5 or GPT 4 Chat API. Depending on what model you have access to, select the appropriate option under "Settings" tab.
    * GPT-4 usage is HIGHLY RECOMMENDED for the copilot functionality.

    <img src="common/images/copilot-settings.png " align="center" />

2. Use the copilot:
    * Once copilot is configured, lick on the "START Converstation" button on the web page and start talking. You should see transcription displayed on the web page in real-time and copilot guidance displayed below that. Note that coplit guidance is based on the natural language template you provide in the settings; you can update the template as necessary and can also tune the template questions/wordings. An example with copilot guidance is shown below.

    <img src="common/images/copilot-sample-output.png " align="center" />

## Deploying sample code to Azure App Service
You can deploy your Node.js app using VS Code and the Azure App Service extension. Follow instructions [Deploy NodeJS using Azure App Service]:https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs?pivots=platform-linux#deploy-to-azure that explains how to deploy any node app to Azure App Service. 

* To deploy **ai-conversational-copilot-apibackend** to Azure App Service, select the “ai-conversational-copilot-apibackend” as the root folder when prompted in the VS code. This app has been successfully deployed to Azure App Service with following settings:
    - Stack: Node 18
    - Operating System: Linux
    - Validate that your ExpressJS backend is successfully deployed by trying to access one of the two APIs hosted by your backend
    - `https://<<your backend Azure App service name>>/api/sayhello`
    - `https://<<your backend Azure App service name>>/api/get-speech-token`

* Similarly, you can deploy **ai-conversational-copilot-webfrontend** to another Azure App Service instance by selecting the root folder for this app. This sample assumes that you are deploying the frontend and the backend app on a **separate** app service instance.
    - Before deploying your “ai-conversational-copilot-webfrontend”, Update “src/main.tsx” as following. Set value of “axios.defaults.baseURL” to point to the backend Azure URL `axios.defaults.baseURL = 'https://<appname>.azurewebsites.net';`
    - In your webfrontend package.json, ensure it is set to use port 8080 with exact settings below '"dev": "vite --port 8080 --host",'
    - Deploy your frontend after updating package.json.
    - Once the application is successfully deployed to Azure App Service, go to Web App -> Configuration -> General Settings and enter following under "Startup Command" `npm run dev`. This will correctly start your webfrontend.
    - You should now be able to access the web app and do real-time transcription from a browser from your mobile phone or any other device that can access the app service url. 

## Issues and resolutions

<table>
<tr>
<td> Issue/Error </td> <td> Resolutions </td>
</tr>
<tr>
<td> **Frontend app initialization error** You might get SSL related errors when starting the frontend web app depending on the node version that's installed on your laptop. Error could be ERR_OSSL_EVP_UNSUPPORTED or similar. </td>
<td>


In the web-app-frontend folder, in the package.json, try to change this:
```json
"scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
```
To

```json
"scripts": {
    "start": "react-scripts --openssl-legacy-provider start",
    "build": "react-scripts --openssl-legacy-provider build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
``` 
That might fix the issue


</td>
</tr>
<tr>
<td> "Invalid Host Header" error in the browser when running the web Frontend </td>
<td>

Add DANGEROUSLY_DISABLE_HOST_CHECK=true in the .env for the front end. This solution is not recommended for production deployment. This is to enable a quick demonstration of real-time speech streaming capability using the web browser. 

</td>
</tr>
</table>


## Getting started

Follow the individual instructions for each step of the accelerator provided within above `Folders`.

## License
Copyright (c) Microsoft Corporation

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE


## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## DISCLAIMER

This presentation, demonstration, and demonstration model are for informational purposes only and (1) are not subject to SOC 1 and SOC 2 compliance audits, and (2) are not designed, intended or made available as a medical device(s) or as a substitute for professional medical advice, diagnosis, treatment or judgment. Microsoft makes no warranties, express or implied, in this presentation, demonstration, and demonstration model. Nothing in this presentation, demonstration, or demonstration model modifies any of the terms and conditions of Microsoft’s written and signed agreements. This is not an offer and applicable terms and the information provided are subject to revision and may be changed at any time by Microsoft.

This presentation, demonstration, and demonstration model do not give you or your organization any license to any patents, trademarks, copyrights, or other intellectual property covering the subject matter in this presentation, demonstration, and demonstration model.

The information contained in this presentation, demonstration and demonstration model represents the current view of Microsoft on the issues discussed as of the date of presentation and/or demonstration, for the duration of your access to the demonstration model. Because Microsoft must respond to changing market conditions, it should not be interpreted to be a commitment on the part of Microsoft, and Microsoft cannot guarantee the accuracy of any information presented after the date of presentation and/or demonstration and for the duration of your access to the demonstration model.

No Microsoft technology, nor any of its component technologies, including the demonstration model, is intended or made available as a substitute for the professional advice, opinion, or judgment of (1) a certified financial services professional, or (2) a certified medical professional. Partners or customers are responsible for ensuring the regulatory compliance of any solution they build using Microsoft technologies.
