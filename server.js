import * as dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'
import { Configuration, OpenAIApi } from 'openai'
import { Autohook } from 'twitter-autohook'
import Insta from '@androz2091/insta.js'

const supabaseClient = createClient(process.env.Project_URL, process.env.Public_Anon_Key)

async function generateEmbeddings() {
    const configuration = new Configuration({ apiKey: process.env.Openai_Key })
    const openai = new OpenAIApi(configuration)
  
    const documents = [
        "You can set up your US company on Norebase as a C-corp, or an LLC. \n Both LLCs and C-corps are independent corporate entities separate from the founders. \n However, a C-corp has a board of directors overseeing the activities of the company, while LLCs have a flexible management structure. \n Also, a C-corp has shareholders who hold shares in the company while an LLC has owners who split their ownership via an Operating Agreement. Because of this distinction, most investors insist on corporation. \n https://blog.norebase.com/c-corp-or-llc-which-is-best-for-you/ Learn more about the differences from our blog post.",
        "LLP stands for LIMITED LIABILITY PARTNERSHIP.\n An LLP exists when two or more persons (a maximum of 20 persons) go into business together.",
        "An LLP has a general and limited partners. The liability of the general partner is unlimited, while the limited partner's liability is restricted to the amount of his investment.",
        "To register an LLP, you would be required to provide the following; Minimum of two names for reservation. The names must end with the word “Limited Partnership”. Address of the business. Full name, phone number, email address and residential address of all partners. ID card of all partners. E signature of all partners. A partnership agreement.",
        "Trademark rights are territorial. A Nigerian trademark registration does not extend beyond geographical limits of Nigeria. A registered Nigerian trademark does not protect the mark from being used in a different country",
        "To incorporate a company in Ghana, you will be required to provide the following document/information: Proposed name of the operating company. Details of Directors, Shareholders, Secretary (if required), and Beneficial owners of shares. To set up a corporate bank account, it is recommended that one of the directors is a Ghanaian or a foreigner with a work permit. Details of auditor (If you do not have one, one would be appointed for you). Company's registered address, digital address and postal address in Ghana. The share-capital of the company (foreign shareholders have a higher minimum required shareholding). Tax Identification Number (TIN) of Shareholders, Directors and Secretary (if you do not already have a TIN, Norebase can obtain one for you). Notarised Incorporation documents of the parent company (if any) showing the shareholders. Copies of international passports or Ghana Card, and digital passport photographs of the directors, shareholders, secretary, and auditors.",
        "Each country has different timelines. However, it takes an average of 5 - 7 business days from the receipt of full and complete documentation and fees.",
        "An EIN (Employer Identification Number) is a unique nine-digit number that identifies your business for tax purposes. It's similar to a Social Security number but is meant for business related items only. As a business owner, you'll need an EIN to open a business bank account, apply for business licenses and file your tax returns.",
        "Yes, all business owners retain 100% of the business after getting incorporated through us.",
        "Yes. Norebase provides a package, and the client can opt for tax registration along with the incorporation as an add-on service.",
        "Yes, we can convert LLC to C-corp. The process is called a statutory conversion",
        "Yes, one person (U.S. or foreign) can be the President, Secretary, Treasurer, Sole Director and sole stockholder of a Delaware Corporation. Also, one person (U.S. or foreign) can be the member and manager of an LLC.",
        "We only need your international passport to verify the identity of the shareholders and directors of the company.",
        "Yes we assist to set up corporate bank accounts.",
        "That is the first step of registering a trademark. Norebase conducts a search to see the availability of that mark, and reverts to the client.",
        "Yes. Norebase can assist to set up non-profit companies in the US. Reach out to us at support@norebase.com",
        "This depends on the type of US Company. An LLC files taxes on the personal income derived by its owners from the business at the US personal tax rate, while a C-corp files tax returns of the company separate from its founders at the US companies income tax rate.",
        "We currently don't Incorporate in Seychelles"
    ] // Your custom function to load docs
  
    // Assuming each document is a string
    for (const document of documents) {
      // OpenAI recommends replacing newlines with spaces for best results
      const input = document.replace(/\n/g, ' ')
  
      const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input,
      })
  
      const [{ embedding }] = embeddingResponse.data.data
  
      // In production we should handle possible errors
      await supabaseClient.from('documents').insert({
        content: document,
        embedding,
      })
    }
  }

//   generateEmbeddings()

async function askQuestion(question) {
    const { data, error } = await supabaseClient.functions.invoke('ask-custom-data', {
        body: JSON.stringify({ query: question}),
      })
      // console.log(data);
      // console.log(error);
      return data.text
}

// askQuestion();
// (async (ƛ) => {
//     // const webhook = new Autohook({ ...config });
//     const webhook = new Autohook({
//       consumer_key: "7HndZrjLTb03Axo6C5lLU3tfX",
//       consumer_secret: "ukDP7AnE5U3WPqJ2lUjSQf9IrjAJSa3KYDEh5E3OoW7MMy0ToN",
//       token: "293061949-8gV2wUwOyqsAIUPLNCTrDWiW1yHzZSjOmgCctJKo",
//       token_secret: "yzM30JZRYHMk5vkZQaMJ61B2R5q4GRraEJyKlyFlTq1G6",
//       env: "env-beta",
//     //   port: 1337,
//     });
  
//     try {
//       // Removes existing webhooks
//       await webhook.removeWebhooks();
  
//       // Listens to incoming activity
//       await onFollow(webhook);
  
//       // Starts a server and adds a new webhook
//       await webhook.start();
  
//       // Subscribes to a user's activity
//       await webhook.subscribe({
//         oauth_token: "293061949-8gV2wUwOyqsAIUPLNCTrDWiW1yHzZSjOmgCctJKo",
//         oauth_token_secret: "yzM30JZRYHMk5vkZQaMJ61B2R5q4GRraEJyKlyFlTq1G6",
//       });
//     } catch (e) {
//       console.log(e);
//     }
//   })();

const client = new Insta.Client();

client.on('connected', () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return

    message.markSeen();
    // console.log(message.content, 'content message');
    const embeddingResponse =await askQuestion(message.content);
    // console.log(embeddingResponse, 'response');
    message.reply(embeddingResponse);
    if (message.content === '!ping') {
    }
});

client.login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);