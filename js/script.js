const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const suggestions = document.querySelectorAll('.suggestion-list .suggestion');
const themeButton = document.querySelector('.toggle-theme-button');
const deleteChatButton = document.querySelector('.delete-chat-button');
let userMessage = null
let isResponseProcessing = false

// GEMINI API CONFIG
const API_KEY = 'AIzaSyAxNDNPjL8g6ARYKWPcE-5nWKm33NWwAXU'
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`


const loadLocalData = () => {
    const savedChats = localStorage.getItem('savedChats');
    const lightMode = localStorage.getItem('themeColor') === 'light_mode';
    document.body.classList.toggle('light_mode', lightMode)
    themeButton.innerText = lightMode ? 'dark_mode' : 'light_mode'

    chatList.innerHTML = savedChats || ''
    document.body.classList.toggle('hide-header', savedChats)

    chatList.scrollTo(0, chatList.scrollHeight)
}

loadLocalData()


const addTypingEffect = (textElm, responseText, inComingMessageDiv) => {
    const words = responseText.split(' ')
    let currentWordIndex = 0

    const typing = setInterval(() => {
        textElm.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++]
        inComingMessageDiv.querySelector('.icon').classList.add('hide')

        if (currentWordIndex === words.length) {
            clearInterval(typing)
            isResponseProcessing = false
            inComingMessageDiv.querySelector('.icon').classList.remove('hide')
            localStorage.setItem('savedChats', chatList.innerHTML)
        }
        chatList.scrollTo(0, chatList.scrollHeight)
    }, 75);


}


const apiRequest = async (inComingMessageDiv) => {

    const textElm = inComingMessageDiv.querySelector('.text')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: userMessage }],
                }]
            })
        })


        const data = await response.json()

        if (!response.ok) throw new Error(data.error.message)

        const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

        addTypingEffect(textElm, apiResponse, inComingMessageDiv)


    } catch (error) {
        isResponseProcessing = false
        textElm.innerText = error.message
        textElm.classList.add('error')

    } finally {
        inComingMessageDiv.classList.remove('loading')
    }

}




const createMessageElm = (content, ...clases) => {
    const div = document.createElement('div');
    div.classList.add('message', ...clases);
    div.innerHTML = content;
    return div;
}



const showLoadingAnimation = () => {

    const htmls = `
            <div class="message-content">
                <img src="img/gemini.svg" alt="Gemini Img" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick = "copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
    `
    const inComingMessageDiv = createMessageElm(htmls, 'incoming', 'loading')
    chatList.appendChild(inComingMessageDiv)
    chatList.scrollTo(0, chatList.scrollHeight)

    apiRequest(inComingMessageDiv)

}


const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage
    if (!userMessage || isResponseProcessing) return

    isResponseProcessing = true

    const htmls = `
            <div class="message-content">
                <img src="img/chengxin_avatar.png" alt="User Img" class="avatar">
                <p class="text"></p>
            </div>
    `
    const outgoingMessageDiv = createMessageElm(htmls, 'outgoing')
    outgoingMessageDiv.querySelector('.text').innerText = userMessage
    chatList.appendChild(outgoingMessageDiv)

    typingForm.reset()
    chatList.scrollTo(0, chatList.scrollHeight)

    document.body.classList.add('hide-header')

    setTimeout(showLoadingAnimation, 500)
}



// -----------------------------Handle Copy Button-----------------------------------

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector('.text').innerText

    navigator.clipboard.writeText(messageText)
    copyIcon.innerText = 'done'
    setTimeout(() => {
        copyIcon.innerText = 'content_copy'
    }, 1000)
}


// -----------------------------Handle Event-----------------------------------

suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
        userMessage = suggestion.querySelector('.text').innerText
        handleOutgoingChat()
    })
})

typingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingChat()
})


themeButton.addEventListener('click', () => {
    const lightMode = document.body.classList.toggle('light_mode')
    localStorage.setItem('themeColor', lightMode ? 'light_mode' : 'dark_mode')
    themeButton.innerText = lightMode ? 'dark_mode' : 'light_mode'
})

deleteChatButton.addEventListener('click', () => {
    localStorage.removeItem('savedChats')
    if (confirm('Are you sure you want to delete ?')) {
        loadLocalData()
    }

});