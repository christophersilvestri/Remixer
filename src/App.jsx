import { useState } from 'react'
import { FileText, Youtube, Instagram, Linkedin, Facebook, Twitter, Mic, Mail, Download, Share2, Loader2, Check, Settings, X, Copy } from 'lucide-react'
import OpenAI, { APIError } from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

const defaultTemplates = {
  wordpress: {
    prompt: 'Please write a WordPress blog post based on the following content, following the style of the example provided. Use clear headings, paragraphs, and a professional tone. Here is the content:',
    example: 'Example: [Your WordPress post example here...]'
  },
  youtube: {
    prompt: 'Create a compelling YouTube video description from this content, mirroring the tone of the example. Include a catchy hook, a summary, and relevant keywords. Content:',
    example: 'Example: [Your YouTube description example here...]'
  },
  instagram: {
    prompt: 'Generate an engaging Instagram post based on the text below, using the example as a style guide. Make it short, punchy, and include relevant hashtags. Here is the text:',
    example: 'Example: [Your Instagram post example here...]'
  },
  linkedin: {
    prompt: 'Write a professional LinkedIn post based on this content and example. Keep it concise and focused on business insights. Original content:',
    example: 'Example: [Your LinkedIn post example here...]'
  },
  facebook: {
    prompt: 'Create a Facebook post from this content, matching the style of the given example. It should be friendly and encourage discussion. Content:',
    example: 'Example: [Your Facebook post example here...]'
  },
  twitter: {
    prompt: 'Craft a Twitter/X post (max 280 characters) from this text, following the example format. Make it attention-grabbing. Text:',
    example: 'Example: [Your Twitter/X post example here...]'
  },
  podcast: {
    prompt: 'Write a summary for a podcast show notes page based on this content, styled like the example. Highlight the key topics and takeaways. Content:',
    example: 'Example: [Your podcast show notes example here...]'
  },
  email: {
    prompt: 'Draft a short email newsletter blurb from this content, using the provided example as a guide. It should be engaging and have a clear call to action. Content:',
    example: 'Example: [Your email blurb example here...]'
  },
};

function App() {
  const [originalContent, setOriginalContent] = useState('')
  const [selectedAssets, setSelectedAssets] = useState({})
  const [generatedContent, setGeneratedContent] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedAssetId, setCopiedAssetId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [templates, setTemplates] = useState(defaultTemplates);

  const assets = [
    { id: 'wordpress', name: 'WordPress Post', icon: FileText },
    { id: 'youtube', name: 'YouTube Video Description', icon: Youtube },
    { id: 'instagram', name: 'Instagram & TikTok Post', icon: Instagram },
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin },
    { id: 'facebook', name: 'Facebook Post', icon: Facebook },
    { id: 'twitter', name: 'Twitter/X Post', icon: Twitter },
    { id: 'podcast', name: 'Podcast Page', icon: Mic },
    { id: 'email', name: 'Email Newsletter Blurb', icon: Mail }
  ]

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev => ({ ...prev, [assetId]: !prev[assetId] }))
  }

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

    setIsGenerating(true)
    setGeneratedContent({})

    try {
      const promises = selectedAssetIds.map(async (assetId) => {
        const assetName = assets.find(a => a.id === assetId)?.name || assetId
        const template = templates[assetId] || defaultTemplates[assetId];
        
        let prompt = template.prompt.replace('{platform}', assetName) + `\n\n"${originalContent}"`;
        if (template.example) {
          prompt += `\n\nHere is an example of the desired style:\n${template.example}`;
        }
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        })
        
        const result = response.choices[0].message.content
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
      if (error instanceof APIError) {
        if (error.status === 401) {
          alert("Authentication Error: Please check if your OpenAI API key is correct in your .env.local file. You may need to restart the server after adding the key.");
        } else if (error.status === 429) {
          alert("Rate Limit Error: You have exceeded your current quota. Please check your plan and billing details on the OpenAI website.");
        } else {
          alert(`An API error occurred: ${error.message}`);
        }
      } else {
        alert("An unexpected error occurred. Please check the console for details.")
      }
    }

    setIsGenerating(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Left Sidebar */}
      <aside className="w-1/3 max-w-sm p-8 bg-slate-900 text-white space-y-8 flex flex-col">
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

        <div className="space-y-4 flex-grow">
          <h3 className="font-bold text-lg text-slate-300">Select Assets</h3>
          <div className="space-y-3">
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
        
        <div className="space-y-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 text-slate-300 py-3 px-6 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Manage Templates</span>
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
            <div className="space-y-8">
              {Object.entries(generatedContent).map(([assetId, content]) => {
                const asset = assets.find(a => a.id === assetId)
                if (!asset) return null
                const Icon = asset.icon

                return (
                  <div key={assetId} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-slate-800">{asset.name}</h3>
                      <button 
                        onClick={() => copyToClipboard(assetId, content)}
                        className="ml-auto p-2 hover:bg-slate-100 rounded-full"
                      >
                        {copiedAssetId === assetId ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => handleContentEdit(assetId, e.target.value)}
                      className="w-full h-40 p-4 bg-slate-100 text-slate-800 font-sans text-base border-none rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )
              })}
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
          onSave={(newTemplates) => {
            setTemplates(newTemplates)
            setIsSettingsOpen(false)
            // Here you might also save to localStorage or a database
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

function SettingsModal({ templates, onSave, onClose }) {
  const [currentTemplates, setCurrentTemplates] = useState(templates)

  const handleTemplateChange = (assetId, field, value) => {
    setCurrentTemplates(prev => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value,
      }
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
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Manage Content Templates</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow">
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
                  value={currentTemplates[asset.id]?.prompt || ''}
                  onChange={(e) => handleTemplateChange(asset.id, 'prompt', e.target.value)}
                  className="w-full h-24 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`e.g., Rewrite this for ${asset.name}: {content}`}
                />
                <textarea
                  id={`template-example-${asset.id}`}
                  value={currentTemplates[asset.id]?.example || ''}
                  onChange={(e) => handleTemplateChange(asset.id, 'example', e.target.value)}
                  className="w-full h-32 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="Paste an example of the desired output style here..."
                />
              </div>
            ))}
          </div>
        </main>
        
        <footer className="p-6 border-t bg-slate-100 flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="bg-white text-slate-700 px-6 py-2 rounded-lg font-semibold hover:bg-slate-200 border border-slate-300"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(currentTemplates)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Save and Close
          </button>
        </footer>
      </div>
    </div>
  )
}

export default App
