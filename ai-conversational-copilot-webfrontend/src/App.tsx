//App.tsx file content
import React , { Component, RefObject } from 'react';
import { Dropdown, IDropdownOption, PrimaryButton, DefaultButton, TextField, Panel, Text, Link, Pivot, PivotItem, Label } from '@fluentui/react';
import { Container } from 'reactstrap';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { getKeyPhrases, getTokenOrRefresh, getGPTCustomPromptCompletion, getGPTAgentAssist35, getGPTAgentAssist4 } from './api/backend_api_orchestrator.ts';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import './App.css';
import { Delete24Regular } from "@fluentui/react-icons";
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import SpokenLanguageOptions from './AppSettings.tsx';

let recognizer: any;

interface AppState {
    displayText: string;
    displayNLPOutput: string;  
    value: string;
    displayKeyPhrases: string;
    displayPiiText: string;
    gptInsightsOutput: string;
    transcriptEventCount: number;
    isSettingsPanelOpen: boolean;
    conversationTemplate: string;
    copilotChecked: boolean;
    gpt4Checked: boolean;
    agentGuidance: string;
    taskCompleted: string;
    spokenLanguage: string;
}

export default class App extends Component<{}, AppState> {
  private containerRef: RefObject<HTMLDivElement>;
  
  constructor(props: any) {
    super(props);
    this.containerRef = React.createRef();
    this.state = {
        value: '',
        displayText: 'Speak to your microphone or copy/paste conversation transcript here',
        displayNLPOutput: '',
        displayKeyPhrases: '',
        displayPiiText: '',
        gptInsightsOutput: '',
        transcriptEventCount: 0,
        isSettingsPanelOpen: false, 
        conversationTemplate: '',
        copilotChecked: false,
        gpt4Checked: true,
        agentGuidance: '',
        taskCompleted: '',
        spokenLanguage: 'en-US'
    };
    
  }

  handleSpokenLangDropdownChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      this.setState({spokenLanguage: option.key as string});
    } else {
      this.setState({spokenLanguage: 'en-US'});
    }
  };

  handleToggleChange = () => {
    this.setState((prevState) => ({
      copilotChecked: !prevState.copilotChecked,
    }));
  };
  
  handleGPTVersionChange = () => {
    this.setState((prevState) => ({
      gpt4Checked: !prevState.gpt4Checked,
    }));
  };

  scrollLeft = () => { if (this.containerRef.current) {
      this.containerRef.current.scrollLeft -= 200; //Adjust as needed
    }
  };

  scrollRight = () => { if (this.containerRef.current) {
          this.containerRef.current.scrollLeft += 200; //Adjust as needed
      }
  };

  async componentDidMount() { // check for valid speech key/region
      const tokenRes = await getTokenOrRefresh();
      if (tokenRes.authToken === null) {
          this.setState({ displayText: 'ERROR: ' + tokenRes.error });
      }
  }

  async sttFromMic() {
      const tokenObj = await getTokenOrRefresh();      
      const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken as string, tokenObj.region as string);
      speechConfig.speechRecognitionLanguage = this.state.spokenLanguage;        
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
      this.setState({
          displayText: 'Speak to your microphone or copy/paste conversation transcript here' 
      });      

      let resultText = "";
      let nlpText = "";
      let keyPhraseText = "";
      let piiText = "";

      recognizer.sessionStarted = (s: any, e: any) => { };

      recognizer.recognized = async (s: any, e: any) => {
          if(e.result.reason === ResultReason.RecognizedSpeech){
              resultText += `\n${e.result.text}`;    
              this.setState({ displayText: resultText }); 
              this.setState( {transcriptEventCount: this.state.transcriptEventCount+1});
           
            (document.getElementById('transcriptTextarea') as HTMLTextAreaElement).value = resultText;  
            const nlpObj = await getKeyPhrases(e.result.text);   
            const entityText = nlpObj.entityExtracted;             
            if(entityText.length > 12){
                nlpText += entityText;
                this.setState({ displayNLPOutput: nlpText.replace('<br/>', '\n') });
            }
            const keyPhraseOut = JSON.stringify(nlpObj.keyPhrasesExtracted); 
            if(keyPhraseOut.length > 15){
                keyPhraseText += "\n" + keyPhraseOut;
                this.setState({ displayKeyPhrases: keyPhraseText }); 
            }                
            const piiOut = nlpObj.piiExtracted;
            if(piiOut.length > 21){
              piiText += "\n" + piiOut; 
                this.setState({ displayPiiText: piiText.replace('<br/>', '\n') }); 
            } 
            if(this.state.transcriptEventCount % 4 === 0 && this.state.copilotChecked){
              if(this.state.gpt4Checked)
                {this.gptAgentAssist4();}
              else {this.gptAgentAssist35();}
            }            
          }
          else if (e.result.reason === ResultReason.NoMatch) {
              resultText += `\n`
          }
      };
      recognizer.startContinuousRecognitionAsync();
  }

  async stopRecording(){        
      recognizer.stopContinuousRecognitionAsync();    
      if(this.state.copilotChecked){
        if(this.state.gpt4Checked)
          {this.gptAgentAssist4();}
        else {this.gptAgentAssist35();}
      }
  }

  async agentAssistDebug(){              
    if(this.state.copilotChecked){
      if(this.state.gpt4Checked)
        {this.gptAgentAssist4();}
      else {this.gptAgentAssist35();}
    }
  }

  async gptCustomPromptCompetion(){
    var customPromptText = (document.getElementById("customPromptTextarea") as HTMLTextAreaElement).value;
    var transcriptInputForPmt = this.state.displayText;
    const gptObj = await getGPTCustomPromptCompletion(transcriptInputForPmt, customPromptText);
    const gptText = gptObj.data.text;
    try{
        this.setState({ gptInsightsOutput: gptText.replace("\n\n", "") });
    }catch(error){
        this.setState({ gptInsightsOutput: gptObj.data });
    }
  }

  async gptAgentAssist35(){
    var conversationTemplate = this.state.conversationTemplate;    
    var transcriptText = this.state.displayText;
    const gptObj = await getGPTAgentAssist35(transcriptText, conversationTemplate);
    const gptText = gptObj.data.message.content;
    const regex = /First Section:(.*?)Second Section:(.*)/s;
    var contentBetweenSections = '';
    var contentAfterSecondSection = '';   
    const match = gptText.match(regex);
    if (match) {
      contentBetweenSections = match[1].trim();
      contentAfterSecondSection = match[2].trim();      
    } else {
      contentBetweenSections = gptText;
      contentAfterSecondSection = gptText;  
    }

    try{
        this.setState({ agentGuidance: contentBetweenSections });
        this.setState({ taskCompleted: contentAfterSecondSection });
    }catch(error){
        this.setState({ agentGuidance: 'unknown error happened' });
    }
  }

  async gptAgentAssist4(){
    var conversationTemplate = this.state.conversationTemplate;    
    var transcriptText = this.state.displayText;
    const gptObj = await getGPTAgentAssist4(transcriptText, conversationTemplate);
    const gptText = gptObj.data.message.content;
    const regex = /First Section:(.*?)Second Section:(.*)/s;
    var contentBetweenSections = '';
    var contentAfterSecondSection = '';   
    const match = gptText.match(regex);
    if (match) {
      contentBetweenSections = match[1].trim();
      contentAfterSecondSection = match[2].trim();      
    } else {
      contentBetweenSections = gptText;
      contentAfterSecondSection = gptText;  
    }

    try{
        this.setState({ agentGuidance: contentBetweenSections });
        this.setState({ taskCompleted: contentAfterSecondSection });
    }catch(error){
        this.setState({ agentGuidance: 'unknown error happened' });
    }
  }

  openSettingsPanel = () => { this.setState({ isSettingsPanelOpen: true }); }
  closeSettingsPanel = () => { this.setState({ isSettingsPanelOpen: false });  }
  onConversationTemplateChange = () => {
    var conversationTemplateText = (document.getElementById("conversationtemplatetextarea") as HTMLTextAreaElement).value;
    this.setState({conversationTemplate: conversationTemplateText})
  }

  onTranscriptTextareaChange = () => {
    var transcritionText = (document.getElementById("transcriptTextarea") as HTMLTextAreaElement).value;
    this.setState({displayText: transcritionText})
  }

  onClearAllTextarea = () => {
    this.setState({displayText: ''});
    this.setState({displayNLPOutput: ''});
    this.setState({displayKeyPhrases: ''});
    this.setState({displayPiiText: ''});
    this.setState({gptInsightsOutput: ''});    
    (document.getElementById("customPromptTextarea") as HTMLTextAreaElement).value= '';
    (document.getElementById("transcriptTextarea") as HTMLTextAreaElement).value= '';
  }

  render() {   
    return (
        <Container className="app-container">     
          <div className="card text-white bg-dark mb-3 text-center">
              <h3 className="card-header">Azure AI + Azure OpenAI powered Conversational Copilot</h3>
              <form className="row row-cols-lg-auto g-3 text-white">                  
                  <div className="col-12">
                  <div className="button-container">
                      <PrimaryButton onClick={() => this.sttFromMic()}>START Conversation</PrimaryButton>&emsp; &ensp;
                      <DefaultButton onClick={() => this.stopRecording()}>END Conversation</DefaultButton>&emsp; &ensp;                 
                      <PrimaryButton onClick={this.openSettingsPanel}>Settings</PrimaryButton>
                      <Delete24Regular id="clearAlltextarea" color='gray' onClick={this.onClearAllTextarea}></Delete24Regular>
                      <Panel headerText="Application Settings"
                            isOpen={this.state.isSettingsPanelOpen} isBlocking={false}
                            onDismiss={this.closeSettingsPanel}  >     
                            <p></p>   
                            <Label>Spoken Language for Conversation</Label>
                            <Dropdown placeholder="Select Language" id="selectSpokenConvLanguage"
                                options={SpokenLanguageOptions()}
                                selectedKey={this.state.spokenLanguage}
                                onChange={this.handleSpokenLangDropdownChange}
                            />  <p></p>  
                            <div className="copilotsection-container">
                              <Label>Configure Copilot Settings</Label>
                              <Toggle label="Enable Copilot?" onText="Enabled" offText="Disabled" inlineLabel checked={this.state.copilotChecked} onChange={this.handleToggleChange}/>
                              {this.state.copilotChecked && (
                                <div>
                                  <p>Enter Conversation Template below to use the Copilot</p>
                                  <TextField  label="Conversation template" multiline autoAdjustHeight
                                      id="conversationtemplatetextarea"
                                      defaultValue={this.state.conversationTemplate}                                
                                      onChange={this.onConversationTemplateChange}         
                                  />  
                                  <Toggle label="GPT version (3.5 or 4)" onText="Using GPT4" offText="Using GPT3.5" inlineLabel checked={this.state.gpt4Checked} onChange={this.handleGPTVersionChange}/>
                                </div>
                              )}
                            </div>
                            <Label>Need help with this demo?</Label>
                            <Text>{'Here is  '}
                              <Link href="https://azureopenaicallintel.z13.web.core.windows.net/" underline target="_blank">
                                How-to videos & demo resources
                              </Link>{' '}         
                            </Text>
                            <PrimaryButton text="Close" onClick={this.closeSettingsPanel} styles={{ root: { marginTop: '16px'} }} />
                      </Panel>
                      </div>
                  </div>
              </form>
          </div>

          <div className="row">
                <div className="col-6 stt-title">
                    <div style={{ "color": "black" }}>Real-time Transcription with Azure AI Speech Service</div>
                </div>
                <div className="col-6 nlp-title">
                    <div style={{ "color": "black" }}>Call Insights Extraction with Azure AI Language Service</div>
                </div>
          </div>

          <div className="text-area-container">
            <div className="row">   
                  <div className="col-6" >     
                    <textarea className="form-control" id="transcriptTextarea" rows={8} 
                    defaultValue={this.state.displayText} onChange={this.onTranscriptTextareaChange} />   
                  </div>   
                  <div className="col-6">   
                  <Pivot aria-label="Language AI insights">
                    <PivotItem headerText="Entities Extracted">
                      <textarea className="form-control" id="entitiesTextarea" rows={9} defaultValue={this.state.displayNLPOutput}></textarea>
                    </PivotItem>
                    <PivotItem headerText="PII redacted transcript">
                      <textarea className="form-control" id="piiTextarea" rows={9} defaultValue={this.state.displayPiiText}></textarea>                      
                    </PivotItem>          
                    <PivotItem headerText="Key Phrases">
                      <textarea className="form-control" id="keyphrasesTextarea" rows={9} defaultValue={this.state.displayKeyPhrases}></textarea>
                    </PivotItem>
                  </Pivot>          
                </div>  
            </div>    
          </div>

          <p> </p>
          {this.state.copilotChecked && (
              <div className="llm-area-container">
                <div style={{ color: 'black', fontSize: 20, display: 'flex', justifyContent: 'center' }}>Live Agent Guidance provided by Azure OpenAI GPT</div>
                <div className="row">     
                    <div className="col-6">   
                        <Pivot aria-label="Converstion Guidance">
                            <PivotItem headerText="Pending Questions">
                              <textarea className="form-control" id="taskPendingTextarea" rows={10} defaultValue={this.state.agentGuidance}></textarea>
                            </PivotItem>
                            <PivotItem headerText="Conversation Template">
                              <textarea className="form-control" id="placeholderTextarea" rows={10} defaultValue={this.state.conversationTemplate}></textarea>                      
                            </PivotItem>                              
                        </Pivot>  
                        <DefaultButton onClick={() => this.agentAssistDebug()}>Go</DefaultButton>&emsp; &ensp;            
                    </div>
                    <div className="col-6"> 
                        <Pivot aria-label="Converstion Insights">
                            <PivotItem headerText="Tasks Completed">
                              <textarea className="form-control" id="taskCompletedTextarea" rows={10} defaultValue={this.state.taskCompleted}></textarea>
                            </PivotItem>         
                            <PivotItem headerText="Follow-ups">
                              <textarea className="form-control" id="followupTextarea" rows={10} defaultValue={String(this.state.transcriptEventCount)}></textarea>
                            </PivotItem>
                        </Pivot>                   
                    </div>   
                </div>    
              </div> 
          )}

          <div style={{ color: 'black', fontSize: 20, display: 'flex', justifyContent: 'center' }}>Prompt Engineering to Guide Azure OpenAI GPT extract custom Business Insights</div>
          <div style={{ color: 'black', fontSize: 5, display: 'flex', justifyContent: 'center' }}>.</div>
          <div className="row text-dark">
              <div className="col-6">
                  <label form="customPromptTextarea" className="form-label" style={{ "color": "black" }}>Enter your custom prompt: </label>&emsp; &ensp;
                  <PrimaryButton onClick={() => this.gptCustomPromptCompetion()}>Extract Insights</PrimaryButton>                    
                  <textarea className="form-control" id="customPromptTextarea"  rows={12} style={{ "color": "black", "borderWidth": "1px", 'borderColor': "grey", 'borderStyle': 'groove', overflowY: 'auto' }}></textarea>
              </div>
              <div className="col-6">
                  <p></p>
                  <textarea className="form-control" id="entitiesTextarea" rows={13} defaultValue={this.state.gptInsightsOutput}></textarea>                  
              </div>
          </div>
          
          
    </Container>
    );
  }//end of render method
}//end of App class


