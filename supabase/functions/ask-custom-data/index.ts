// @ts-nocheck
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts' 
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import GPT3Tokenizer from 'https://esm.sh/gpt3-tokenizer@1.1.5'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'
import { stripIndent, oneLine } from 'https://esm.sh/common-tags@1.8.2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const supabaseClient = createClient(process.env.supabase_PROJECT, process.env.supabase_key);


serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Search query is passed in request payload
    const { query } = await req.json()

    // OpenAI recommends replacing newlines with spaces for best results
    const input = query.replace(/\n/g, ' ')

    const configuration = new Configuration({ apiKey: process.env.openAI_KEY })
    const openai = new OpenAIApi(configuration)

    // Generate a one-time embedding for the query itself
    const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input,
    })

    const [{ embedding }] = embeddingResponse.data.data

    // Fetching whole documents for this simple example.
    //
    // Ideally for context injection, documents are chunked into
    // smaller sections at earlier pre-processing/embedding step.
    const { data: documents, error } = await supabaseClient.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.78, // Choose an appropriate threshold for your data
        match_count: 10, // Choose the number of matches
    })

    if (error) throw error

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
    let tokenCount = 0
    let contextText = ''
  
    // Concat matched documents
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]
      const content = document.content
      const encoded = tokenizer.encode(content)
      tokenCount += encoded.text.length
  
      // Limit context to max 1500 tokens (configurable)
      if (tokenCount > 1500) {
        break
      }
  
      contextText += `${content.trim()}\n---\n`
    }

    const prompt = stripIndent`${oneLine`
    You are a representative that is very helpful when it comes to talking about Cooper Codes! Only ever answer
    truthfully and be as helpful as you can!"`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
    """
    Answer as simple text:
  `

    // In production we should handle possible errors
    const completionResponse = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 512, // Choose the max allowed tokens in completion
        temperature: 0, // Set to 0 for deterministic results
    })

    const {
        id,
        choices: [{ text }],
      } = completionResponse.data

    // return the response from the model to our use through a Response
    return new Response(JSON.stringify({ id, text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
})