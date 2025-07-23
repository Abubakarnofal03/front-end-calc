export async function speakText(text: string) {
  if ('speechSynthesis' in window) {
    // Use browser's built-in TTS
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    
    // Try to use a natural voice
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    )
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    speechSynthesis.speak(utterance)
    return true
  }
  return false
}

// Optional: ElevenLabs integration if API key is provided
export async function speakWithElevenLabs(text: string) {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  if (!apiKey) return false

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (response.ok) {
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      await audio.play()
      return true
    }
  } catch (error) {
    console.error('ElevenLabs TTS error:', error)
  }
  
  return false
}