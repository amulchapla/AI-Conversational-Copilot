import axios from 'axios'; // Import AxiosError and AxiosResponse types
import Cookie from 'universal-cookie';

interface TokenResponse {
  authToken: string | null;
  region?: string;
  error?: string;
}

export async function getTokenOrRefresh(): Promise<TokenResponse> {
  const cookie = new Cookie();
  const speechToken = cookie.get('speech-token');

  if (speechToken === undefined) {
    try {
      console.log('Try getting token from the express backend');
      const res = await axios.get('/api/get-speech-token');
      const token = res.data.token;
      const region = res.data.region;
      cookie.set('speech-token', region + ':' + token, { maxAge: 540, path: '/' });

      console.log('Token fetched from back-end: ' + token);
      return { authToken: token, region };
    } catch (err: unknown) { // Specify the type of err as unknown
      if (axios.isAxiosError(err)) { // Check if the error is an AxiosError
        console.log(err.response?.data);
        return { authToken: null, error: 'Unable to get Speech token' };
      }
      throw err; // Re-throw the error if it's not an AxiosError
    }
  } else {
    console.log('Token fetched from cookie: ' + speechToken);
    const idx = speechToken.indexOf(':');
    return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
  }
}

interface NLPResponse {
  keyPhrasesExtracted: string;
  entityExtracted: string;
  piiExtracted: string;
}

export async function getKeyPhrases(requestText: string): Promise<NLPResponse> {
  try {
    // Key Phrase extraction
    const data = { transcript: requestText };
    const headers = { 'Content-Type': 'application/json' };
    const res = await axios.post('/azure/language/ta-key-phrases', data, { headers });
    return res.data;
  } catch (err) {
    return { keyPhrasesExtracted: 'NoKP', entityExtracted: 'NoEnt' , piiExtracted: 'NoPII'};
  }
}

export async function getGPTCustomPromptCompletion(requestText: string, customPrompt: string): Promise<any> {
  try {
    // GPT prompt completion
    const data = { transcript: requestText, customPrompt };
    const headers = { 'Content-Type': 'application/json' };
    const res = await axios.post('/openai/gpt/customPrompt', data, { headers });
    return res;
  } catch (err) {
    return {
      data: 'Error occurred while invoking backend API: ' + err,
    };
  }
}

export async function gptLiveGuidance(transcriptText: string, customTemplate: string): Promise<any> {
  try {
    //ChatGPT Agent Assist
    const data = { transcript: transcriptText, customTemplate: customTemplate};
    const headers = { 'Content-Type': 'application/json' };
    const res = await axios.post('/openai/gpt/liveguidance', data, { headers });
    return res;
  } catch (err) {
    return {
      data: 'Error occurred while invoking backend API: ' + err,
    };
  }
}

//Get images from Azure Blob - input blobprefix which can be case number
export async function getImageSasUrls(caseNumber: string): Promise<any> {
  try {
    //ChatGPT Agent Assist
    const data = { blobprefix: caseNumber};
    const headers = { 'Content-Type': 'application/json' };
    const res = await axios.post('/data/storage/listBlobs', data, { headers });
    return res;
  } catch (err) {
    return {
      data: 'Error occurred while invoking backend API to get images: ' + err,
    };
  }
}

//Get image insights using GPTV
export async function getGPTVInsights(imageList: []): Promise<any> {
  try {
    //ChatGPT Agent Assist
    const data = imageList;
    const headers = { 'Content-Type': 'application/json' };
    const res = await axios.post('/openai/gptv/imageinsights', data, { headers });
    return res;
  } catch (err) {
    return {
      data: 'Error occurred while invoking backend API to GPTV insights: ' + err,
    };
  }
}



  
  