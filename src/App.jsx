import { useState, useMemo, useEffect, useRef } from 'react'
import { FileText, Youtube, Instagram, Linkedin, Facebook, Twitter, Mic, Mail, Download, Share2, Loader2, Check, Settings, X, Copy, Zap, Database, ChevronDown, ChevronUp, Quote } from 'lucide-react'
import OpenAI, { APIError } from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const defaultTemplates = {
  wordpress: {
    prompt: `You are a B2B SaaS podcast producer for "The Message-Market Fit Podcast." Your job is to write clear, compelling, insight-driven show notes for each episode using the structure and voice of past episodes. You're speaking to busy but curious B2B marketers, product people, and founders who care about messaging, positioning, and growth strategy.

    The transcript you're given is a full episode interview. Use it to write complete show notes in this exact format:
        
    Follow this naming formula:
    [Guest Name] – [Guest Role or Notable Hook]: [Key Topics Teased in Natural Language] (TMMF #[episode number])
    
    Make the subtitle specific, curiosity-driven, and benefit-focused. Prioritize clarity over cleverness.
    
    Choose one insight-rich, human-sounding quote from the guest that captures the episode's essence. It should be opinionated, strategic, or surprising. Format it with em dashes and double quotes.
    
    Summarize the episode's core value in 1–2 punchy paragraphs. Who is the guest? What's their background? What did this episode explore that listeners will care about? Mention 2–3 juicy specifics. Use vivid verbs. Make it feel like you're inviting the reader to listen.
    
    Go deeper on 4–6 of the most interesting ideas discussed. For each:
    
    Frame the topic clearly (what it is, why it matters)
    
    Pull in concrete examples or explanations from the guest
    
    Mention any frameworks, challenges, comparisons, or methods shared
    
    Avoid summarizing in a generic way—aim for takeaways that would make someone say, "That's worth writing down."
    
    Include a short nudge to listen—mention who it's for (marketers, PMs, etc.) and what they'll get out of it. End with "Enjoy!"
    
    Link to the podcast and YouTube versions. Invite the listener to check out past episodes or comment with their favorite takeaway.
    
    CONNECT SECTION:
    List links to the guest's website, Twitter, and LinkedIn (or any other asset mentioned during the podcast) if available.
    
    SHOW NOTES TIMESTAMPS:
    Break the episode down into major timestamped sections (each ~3–6 minutes long). Use short but informative titles (e.g. "How Synthetic Users Got Started" or "The Biases We Want AI to Have"). Bullet the timestamps and ensure they're in order.
    
    MORE QUOTES SECTION:
    Pull 4–6 more of the most memorable, tweetable, or insight-rich quotes from the episode. Prioritize strategic POVs or framing that shows unique thinking.
    
    After generating, review for voice: confident, human, and strategic—like a sharp colleague walking you through what matters. Avoid bloated phrasing or lazy summaries. Think "executive brief with flavor."
    
    Input:
    [paste transcript here]
    
    Output:
    Formatted show notes using the above template.`
  },
  youtube: {
    prompt: `You are writing a YouTube video description for an episode of The Message-Market Fit Podcast. Your job is to make it clear, specific, and actionable—so a busy SaaS founder or marketer skimming YouTube immediately sees the value of watching.

Follow this exact structure and formatting. Do not deviate from the Tool Stack, CTA, or URL formatting.

🎙 TITLE (first line)
Use this format:
The [Guest Hook or Title]: [Guest Name] on [Key Topic 1], [Key Topic 2] & [Key Topic 3] (TMMF #[episode number])

🧠 EPISODE SUMMARY
Start with 1–2 concise sentences introducing the guest, their credibility, and why this episode matters.

Then write 1–2 paragraphs summarizing 4–6 concrete highlights from the episode:

What frameworks, strategies, or mental models did they share?

What misconceptions did they challenge?

What practical takeaways will the audience walk away with?

End with a clear line on who this is for (e.g. "Whether you're a founder, marketer, or product leader...") and what they'll get out of watching.

⚒️ MY TOOL STACK (copy/paste this exactly)
⚒️ MY TOOL STACK:
Notion - https://bit.ly/3RkYQi7 to manage my entire life, including client projects, knowledge storage and retrieval, habits, goals and more.
Readwise - https://bit.ly/4adia9Q to store, synchronize and resurface all my book and article highlights.
BetterProposals - https://bit.ly/3WrbGfw (get your first month free) to create and send all my custom proposals, sign agreements and get paid - in one go with a 90% conversion rate.
Hotjar - https://bit.ly/3D2DbVO to collect user interaction data, analyze heatmaps, user recordings and run surveys.
Fathom - http://bit.ly/3D4vKxs to record and transcribe my meetings
TeamGPT - https://bit.ly/4l6WfWH to collaborate on AI copy
(I get a small commission if you sign up using these links)
GrowthMentor - https://bit.ly/48mBwYc where I regularly host coaching sessions and mentor founders, marketing, growth and product people.

💼 MY WORK (copy/paste this exactly)
🧑🏼‍💻 SaaS or ecommerce? Let's get your website to sell more - https://conversionalchemy.net/

⏱️ TIMESTAMPS
Use this format and style:
00:59 [Topic title – keep it clear and curiosity-driven]
List 10–12 timestamped topics from the episode, each reflecting a distinct conversation segment or key idea.

📄 SHOW NOTES LINK (update only the episode number and guest name)
Get the full show notes here → https://christophersilvestri.com/podcast/tmmf[episode-number]-[guest-name-hyphenated-lowercase]

Example for episode 036 with Maja Voje:
→ https://christophersilvestri.com/podcast/tmmf036-maja-voje

Voice & Style Guidelines:

Write like a strategic peer, not a marketer

Keep it specific and value-dense

Prioritize frameworks, mental shifts, or methods over "vibes" or hype

Avoid intros like "In this video..." or "Join us as we..."

Make them want to learn, not just listen`
  },
  instagram: {
    prompt: 'Generate an engaging Instagram post based on the text below. Make it short, punchy, and include relevant hashtags. Here is the text:'
  },
  linkedin: {
    prompt: 'Write a professional LinkedIn post based on this content. Keep it concise and focused on business insights. Original content:'
  },
  facebook: {
    prompt: 'Create a Facebook post from this content. It should be friendly and encourage discussion. Content:'
  },
  twitter: {
    prompt: 'Craft a Twitter/X post (max 280 characters) from this text. Make it attention-grabbing. Text:'
  },
  podcast: {
    prompt: `You're writing the full podcast page content for an episode of The Message-Market Fit Podcast. The layout includes: episode title, episode summary, detailed episode notes, guest links, and show notes with timestamps.

Your tone should be confident, informative, and helpful—like a smart strategist explaining what's inside, not hyping it up.

STRUCTURE & FORMAT TO FOLLOW:
🎙 Episode Title
Use this format:
[Guest Name] – [Guest Role or Hook]: [Key Episode Topics or Takeaways] (TMMF #[episode number])

📌 Episode Summary (short version for preview text)
1–2 sentences. Describe the conversation in a single paragraph. Who is the guest? What unique perspective or topic do they bring? Keep it tight, like a meta description. End with a teaser-style benefit.
Don't exceed 3 sentences.

📝 Episode Notes (expanded write-up)
Write 3–4 short paragraphs that go deeper into:

What this episode explores

What frameworks or practical takeaways listeners will get

Any especially compelling or controversial points

Why this topic matters now

End with a short CTA-style closer:
"Whether you're a [X], [Y], or [Z], this episode offers valuable insights into [core theme]. Enjoy!"

🔗 CONNECT WITH [GUEST NAME]
List 3 links in this order, using markdown-style formatting or clear bullet points:

[Guest] on LinkedIn

[Guest's Company or Project Website]

[Guest] on Twitter

If a link isn't available, leave it out.

🕐 SHOW NOTES
List timestamps in this format:
00:00 [Clear, Specific Topic Title]
Keep each line concise but benefit-driven. Pull out 10–12 distinct segments from the episode. Make each one feel useful at a glance—less like a label, more like a takeaway.

STYLE & VOICE NOTES:

Don't sound templated—each section should feel tailored

Avoid vague summaries ("we cover a lot of ground")

Be specific about tools, techniques, frameworks, and takeaways

Match the clean, strategic voice of a B2B SaaS operator

Input:
Transcript or notes from episode [insert guest name and number]

Output:
Podcast page copy with:

Title

Episode Summary

Episode Notes

Guest Links

Timestamps
...all formatted to drop directly into your CMS.

`
  },
  email: {
    prompt: `You're writing a short, conversational promo for a new episode of The Message-Market Fit Podcast to go in the newsletter. The audience is smart, curious B2B marketers, founders, and operators who care about positioning, messaging, and customer-led growth. Keep it human, specific, and useful—not fluffy.

Follow this format:

Episode [episode number] of The Message-Market Fit Podcast is out!

[Insert video preview or image embed link if available]

Write 1–2 short, energetic sentences introducing the guest and the theme. Mention their credentials or background briefly—focus on credibility and curiosity ("I had a great chat with [Guest Name], a [describe role/credibility]...").

Lead with: "Here's what you'll learn:"
Then 5–7 bullets max, each one actionable and specific.
Start with verbs or compelling phrasing:

"How to avoid the GTM mistakes that cause 74% of products to fail"

"Why companies resist customer discovery (even when they know better)"

"How to implement a beachhead strategy for focused growth"

Avoid generic or fluffy phrasing—each bullet should hint at a takeaway that feels worth someone's time.

End with:
"Check it out here."
Then:
"And if you find it valuable, would you consider subscribing and leaving a rating? 🙏"

Input:
Transcript or summary of episode

Output:
Formatted newsletter snippet using the structure above. Match tone and pacing to the original Maja Voje example—direct, smart, and no filler.`
  },
  quotes: {
    prompt: `You are analyzing a podcast transcript from The Message-Market Fit Podcast. Your task is to extract 10-15 of the most insightful, punchy, or counterintuitive quotes from the guest—ideally ones that:

Reveal a strong point of view

Challenge conventional thinking

Contain a smart framework, principle, or mental model

Feel "highlightable" (i.e. something a listener would underline or share)

Say something in a memorable or unique way

These quotes should sound natural and sharp, not stiff or overly polished. You may lightly edit for clarity or grammar (e.g., remove filler words, fix fragmented clauses), but do not rewrite or paraphrase.

Guidelines:

Prioritize insight and clarity over length. Most quotes should be 1–3 sentences.

Include attribution only if needed for clarity (e.g., "That's why we built Synthetic Users…").

Exclude generic comments, greetings, or host interjections.

Include quotes that reveal how the guest thinks, not just what they did.

Input:
Full podcast transcript

Output:
A list of 6–10 quotes that could be used in:

Pull quotes on a podcast page

Social posts

Newsletters or episode previews
Each quote should be separated with line breaks and optionally preceded by a bullet or em dash.`
  },
};

const models = [
  {
    provider: 'OpenAI',
    models: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ]
  },
  {
    provider: 'Anthropic',
    models: [
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7' },
      { id: 'claude-3-7-sonnet-latest', name: 'Claude Sonnet 3.7 (Latest)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude Haiku 3.5 (Latest)' },
    ]
  }
];

const allModels = models.flatMap(p => p.models);

function App() {
  const [originalContent, setOriginalContent] = useState('')
  const [selectedAssets, setSelectedAssets] = useState({})
  const [generatedContent, setGeneratedContent] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedAssetId, setCopiedAssetId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [expandedAssets, setExpandedAssets] = useState({});
  
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem('remixer_templates')
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates)
      // Migrate old templates that might have example fields
      const migrated = {}
      Object.keys(parsed).forEach(key => {
        if (parsed[key] && typeof parsed[key] === 'object') {
          // Remove example field if it exists
          const { example, ...templateWithoutExample } = parsed[key]
          migrated[key] = templateWithoutExample
        } else {
          migrated[key] = parsed[key]
        }
      })
      return migrated
    }
    return defaultTemplates
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('remixer_selected_model') || 'gpt-3.5-turbo';
  });

  const [apiKeys, setApiKeys] = useState(() => {
    const savedApiKeys = localStorage.getItem('remixer_api_keys')
    return savedApiKeys ? JSON.parse(savedApiKeys) : {
      openai: import.meta.env.VITE_OPENAI_API_KEY || '',
      anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || ''
    }
  })

  useEffect(() => {
    localStorage.setItem('remixer_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('remixer_selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('remixer_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Initialize API clients
  const openai = useMemo(() => new OpenAI({
    apiKey: apiKeys.openai,
    dangerouslyAllowBrowser: true,
  }), [apiKeys.openai])

  const anthropic = useMemo(() => new Anthropic({
    apiKey: apiKeys.anthropic,
    dangerouslyAllowBrowser: true,
  }), [apiKeys.anthropic])

  const assets = [
    { id: 'wordpress', name: 'WordPress Post', icon: FileText },
    { id: 'youtube', name: 'YouTube Video Description', icon: Youtube },
    { id: 'instagram', name: 'Instagram & TikTok Post', icon: Instagram },
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin },
    { id: 'facebook', name: 'Facebook Post', icon: Facebook },
    { id: 'twitter', name: 'Twitter/X Post', icon: Twitter },
    { id: 'podcast', name: 'Podcast Page', icon: Mic },
    { id: 'email', name: 'Email Newsletter Blurb', icon: Mail },
    { id: 'quotes', name: 'Verbatim Quotes', icon: Quote },
  ]

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev => ({ ...prev, [assetId]: !prev[assetId] }))
  }

  const handleToggleExpand = (assetId) => {
    setExpandedAssets(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  const handleContentEdit = (assetId, newContent) => {
    setGeneratedContent(prev => ({
      ...prev,
      [assetId]: newContent,
    }))
  }

  const exportContent = () => {
    const contentToExport = Object.entries(generatedContent)
      .map(([assetId, content]) => {
        const assetName = assets.find(a => a.id === assetId)?.name || 'Content'
        return `${assetName}\n-----------------\n${content}\n\n`
      })
      .join('')

    const blob = new Blob([contentToExport], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'remixed-content.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (assetId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAssetId(assetId)
      setTimeout(() => setCopiedAssetId(null), 2000) // Reset after 2 seconds
    }, (err) => {
      alert('Failed to copy content.')
      console.error('Could not copy text: ', err)
    })
  }

  const generateContent = async () => {
    const selectedAssetIds = Object.keys(selectedAssets).filter(id => selectedAssets[id])
    if (!originalContent.trim() || selectedAssetIds.length === 0) {
      alert("Please provide content and select at least one asset.")
      return
    }

    const provider = models.find(p => p.models.some(m => m.id === selectedModel))?.provider.toLowerCase();
    
    // Check if API key is set for selected API
    if (!apiKeys[provider]) {
      alert(`Please set your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in the settings.`)
      return
    }

    setIsGenerating(true)
    setGeneratedContent({})

    try {
      const promises = selectedAssetIds.map(async (assetId) => {
        const assetName = assets.find(a => a.id === assetId)?.name || assetId
        const template = templates[assetId] || defaultTemplates[assetId];
        
        let prompt = template.prompt.replace('{platform}', assetName) + `\n\n"${originalContent}"`;
        
        let result;
        
        if (provider === 'openai') {
          const response = await openai.chat.completions.create({
            model: selectedModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          })
          result = response.choices[0].message.content
        } else if (provider === 'anthropic') {
          const response = await anthropic.messages.create({
            model: selectedModel,
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          })
          result = response.content[0].text
        }
        
        return { assetId, result }
      })

      const results = await Promise.all(promises)

      const newContent = {}
      results.forEach(({ assetId, result }) => {
        newContent[assetId] = result
      })
      setGeneratedContent(newContent)

    } catch (error) {
      console.error("Error generating content:", error)
      
      if (provider === 'openai' && error instanceof APIError) {
        if (error.status === 401) {
          alert("OpenAI Authentication Error: Please check if your OpenAI API key is correct in the settings.");
        } else if (error.status === 429) {
          alert("OpenAI Rate Limit Error: You have exceeded your current quota. Please check your plan and billing details.");
        } else {
          alert(`OpenAI API error: ${error.message}`);
        }
      } else if (provider === 'anthropic' && error.status) {
        if (error.status === 401) {
          alert("Anthropic Authentication Error: Please check if your Anthropic API key is correct in the settings.");
        } else if (error.status === 429) {
          alert("Anthropic Rate Limit Error: You have exceeded your current quota. Please check your plan and billing details.");
        } else {
          alert(`Anthropic API error: ${error.message}`);
        }
      } else {
        alert("An unexpected error occurred. Please check the console for details.")
      }
    }

    setIsGenerating(false)
  }

  return (
    <div className="flex h-full min-h-screen bg-slate-100 font-sans">
      {/* Left Sidebar */}
      <aside className="w-1/3 max-w-sm bg-slate-900 text-white flex flex-col h-full">
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="original-content" className="font-semibold text-slate-300">Original Content</label>
            <textarea
              id="original-content"
              value={originalContent}
              onChange={(e) => setOriginalContent(e.target.value)}
              placeholder="Paste or type your original content here..."
              className="w-full h-48 p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-300">Select Assets</h3>
            <div className="space-y-3">
              {/* Select All Checkbox */}
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={assets.every(asset => selectedAssets[asset.id])}
                  onChange={e => {
                    const checked = e.target.checked;
                    const newSelected = {};
                    assets.forEach(asset => {
                      newSelected[asset.id] = checked;
                    });
                    setSelectedAssets(newSelected);
                  }}
                  className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-slate-900"
                />
                <span className="text-sm">Select All</span>
              </label>
              {assets.map(asset => (
                <label key={asset.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={!!selectedAssets[asset.id]}
                    onChange={() => handleAssetToggle(asset.id)}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm">{asset.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-4 border-t border-slate-700">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 text-slate-300 py-3 px-6 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <button
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full bg-yellow-400 text-slate-900 py-3 px-6 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {isGenerating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate Content'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-2/3 p-12 overflow-y-auto">
        <header className="flex items-start justify-between mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-800">Content Remixer</h1>
            <p className="text-slate-500">Your AI-powered content creation studio</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-slate-400">Using:</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                selectedModel.startsWith('gpt') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {allModels.find(m => m.id === selectedModel)?.name || selectedModel}
              </span>
            </div>
          </div>
          {Object.keys(generatedContent).length > 0 && !isGenerating && (
            <button
              onClick={exportContent}
              className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          )}
        </header>

        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="font-medium text-lg">Remixing your content...</p>
              <p className="text-sm">This may take a few moments.</p>
            </div>
          </div>
        ) : (
          Object.keys(generatedContent).length > 0 ? (
            <div className="space-y-4">
              {assets.map(asset => {
                const assetId = asset.id;
                const content = generatedContent[assetId];
                if (!content) return null;
                const Icon = asset.icon;
                const isExpanded = !!expandedAssets[assetId];
                return (
                  <div key={assetId} className="bg-white rounded-xl border border-slate-200">
                    <button
                      className="w-full flex items-center space-x-3 p-6 focus:outline-none group"
                      onClick={() => handleToggleExpand(assetId)}
                      aria-expanded={isExpanded}
                    >
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="font-semibold text-lg text-slate-800 text-left flex-1 group-hover:underline">{asset.name}</span>
                      {/* Content indicator dot */}
                      <span className={`h-2 w-2 rounded-full ml-2 ${content ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      {/* Copy icon in collapsed view */}
                      {content && (
                        <button
                          onClick={e => { e.stopPropagation(); copyToClipboard(assetId, content); }}
                          className="ml-2 p-2 hover:bg-slate-200 rounded-full"
                          title="Copy content"
                        >
                          {copiedAssetId === assetId ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      )}
                      <span className="ml-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100">
                        <AutosizeTextarea
                          value={content}
                          onChange={(e) => handleContentEdit(assetId, e.target.value)}
                          className="w-full p-4 bg-slate-100 text-slate-800 font-sans text-base border-none rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button 
                            onClick={() => copyToClipboard(assetId, content)}
                            className="p-2 hover:bg-slate-200 rounded-full"
                            title="Copy content"
                          >
                            {copiedAssetId === assetId ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Collapse/Expand All Button */}
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 border border-slate-300"
                  onClick={() => {
                    const allExpanded = assets.every(asset => expandedAssets[asset.id]);
                    const newExpanded = {};
                    assets.forEach(asset => {
                      newExpanded[asset.id] = !allExpanded;
                    });
                    setExpandedAssets(newExpanded);
                  }}
                >
                  {assets.every(asset => expandedAssets[asset.id]) ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl p-16">
                <FileText className="w-16 h-16 mx-auto mb-6 text-slate-400" />
                <p className="font-medium text-lg">Your remixed content will appear here</p>
                <p className="text-sm mt-1">Provide some content, select your assets, and click Generate.</p>
              </div>
            </div>
          )
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal
          templates={templates}
          setTemplates={setTemplates}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

function AutosizeTextarea({ value, onChange, className, ...props }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset the height to ensure the scrollHeight is calculated correctly.
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      rows={1}
      className={`${className} overflow-hidden`}
      {...props}
    />
  );
}

function SettingsModal({ 
  templates, setTemplates, 
  selectedModel, setSelectedModel, 
  apiKeys, setApiKeys, 
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('api') // 'api' or 'templates'

  const handleTemplateChange = (assetId, field, value) => {
    setTemplates(prev => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value,
      }
    }))
  }

  const handleApiKeyChange = (api, value) => {
    setApiKeys(prev => ({
      ...prev,
      [api]: value
    }))
  }

  const assetList = [
    { id: 'wordpress', name: 'WordPress Post' },
    { id: 'youtube', name: 'YouTube Video Description' },
    { id: 'instagram', name: 'Instagram & TikTok Post' },
    { id: 'linkedin', name: 'LinkedIn Post' },
    { id: 'facebook', name: 'Facebook Post' },
    { id: 'twitter', name: 'Twitter/X Post' },
    { id: 'podcast', name: 'Podcast Page' },
    { id: 'email', name: 'Email Newsletter Blurb' },
    { id: 'quotes', name: 'Verbatim Quotes' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('api')}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>API Settings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Content Templates</span>
              </div>
            </button>
          </div>
        </div>

        <main className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select AI Model</h3>
                <p className="text-sm text-slate-500 mb-4">Choose the specific AI model you want to use for content generation.</p>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {models.map(providerGroup => (
                    <optgroup key={providerGroup.provider} label={providerGroup.provider}>
                      {providerGroup.models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="openai-key" className="block text-sm font-medium text-slate-700 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    id="openai-key"
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    placeholder="sk-..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
                  </p>
                </div>

                <div>
                  <label htmlFor="anthropic-key" className="block text-sm font-medium text-slate-700 mb-2">
                    Anthropic API Key
                  </label>
                  <input
                    id="anthropic-key"
                    type="password"
                    value={apiKeys.anthropic}
                    onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <p className="text-slate-600 mb-6">
                Customize the prompts used to generate content for each platform. Use 
                <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded-md text-sm font-mono">{"{content}"}</code> 
                as a placeholder for the original content.
              </p>
              <div className="space-y-6">
                {assetList.map(asset => (
                  <div key={asset.id}>
                    <label htmlFor={`template-prompt-${asset.id}`} className="block text-lg font-semibold text-slate-700 mb-2">{asset.name}</label>
                    <textarea
                      id={`template-prompt-${asset.id}`}
                      value={templates[asset.id]?.prompt || ''}
                      onChange={(e) => handleTemplateChange(asset.id, 'prompt', e.target.value)}
                      className="w-full h-24 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`e.g., Rewrite this for ${asset.name}: {content}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    localStorage.removeItem('remixer_templates');
                    setTemplates(defaultTemplates);
                  }}
                  className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 border border-red-200 transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          )}
        </main>
        
        <footer className="p-6 border-t bg-slate-100 flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}

export default App
