import { useState, useMemo, useEffect, useRef } from 'react'
import { FileText, Youtube, Instagram, Linkedin, Facebook, Twitter, Mic, Mail, Download, Share2, Loader2, Check, Settings, X, Copy, Zap, Database, ChevronDown, ChevronUp } from 'lucide-react'
import OpenAI, { APIError } from 'openai'
import Anthropic from '@anthropic-ai/sdk'

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
    return savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates
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
    { id: 'email', name: 'Email Newsletter Blurb', icon: Mail }
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
        if (template.example) {
          prompt += `\n\nHere is an example of the desired style:\n${template.example}`;
        }
        
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
            <div className="space-y-8">
              {Object.entries(generatedContent).map(([assetId, content]) => {
                const asset = assets.find(a => a.id === assetId)
                if (!asset) return null
                const Icon = asset.icon
                const isExpanded = !!expandedAssets[assetId];

                return (
                  <div key={assetId} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-slate-800">{asset.name}</h3>
                      
                      <div className="ml-auto flex items-center space-x-1">
                        <button 
                          onClick={() => copyToClipboard(assetId, content)}
                          className="p-2 hover:bg-slate-100 rounded-full"
                          title="Copy content"
                        >
                          {copiedAssetId === assetId ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleToggleExpand(assetId)}
                          className="p-2 hover:bg-slate-100 rounded-full"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    {isExpanded ? (
                      <AutosizeTextarea
                        value={content}
                        onChange={(e) => handleContentEdit(assetId, e.target.value)}
                        className="w-full p-4 bg-slate-100 text-slate-800 font-sans text-base border-none rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <div 
                        className="p-4 bg-slate-50 rounded-lg text-slate-700 text-sm font-sans whitespace-pre-wrap cursor-pointer"
                        onClick={() => handleToggleExpand(assetId)}
                      >
                        {content.substring(0, 200)}{content.length > 200 && '...'}
                      </div>
                    )}
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
                    <textarea
                      id={`template-example-${asset.id}`}
                      value={templates[asset.id]?.example || ''}
                      onChange={(e) => handleTemplateChange(asset.id, 'example', e.target.value)}
                      className="w-full h-32 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="Paste an example of the desired output style here..."
                    />
                  </div>
                ))}
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
