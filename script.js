document.addEventListener("DOMContentLoaded", () => {
  const codeEditor = document.getElementById("code-editor")
  const highlightedCode = document.getElementById("highlighted-code")
  const selectedLanguage = document.getElementById("selected-language")
  const languageSelectBtn = document.getElementById("language-select-btn")
  const expirySelect = document.getElementById("expiry-select")
  const saveBtn = document.getElementById("save-btn")
  const copyBtn = document.getElementById("copy-btn")
  const newBtn = document.getElementById("new-btn")
  const linkContainer = document.getElementById("link-container")
  const shareLink = document.getElementById("share-link")
  const copyLinkBtn = document.getElementById("copy-link-btn")
  const expiryTime = document.getElementById("expiry-time")
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")
  const themeToggle = document.getElementById("theme-toggle")
  const languageToggle = document.getElementById("language-toggle")
  const languageOptions = languageToggle.querySelectorAll("span")
  const viewModeBanner = document.getElementById("view-mode-banner")
  const forkBtn = document.getElementById("fork-btn")
  const lineCount = document.getElementById("line-count")
  const charCount = document.getElementById("char-count")
  const sharedTime = document.getElementById("shared-time")

  const overlay = document.getElementById("overlay")
  const languageModal = document.getElementById("language-modal")
  const languageModalClose = document.getElementById("language-modal-close")
  const languageSearch = document.getElementById("language-search")
  const languageGrid = document.getElementById("language-grid")
  const alertModal = document.getElementById("alert-modal")
  const alertTitle = document.getElementById("alert-title")
  const alertMessage = document.getElementById("alert-message")
  const alertOk = document.getElementById("alert-ok")
  const alertModalClose = document.getElementById("alert-modal-close")
  const confirmModal = document.getElementById("confirm-modal")
  const confirmTitle = document.getElementById("confirm-title")
  const confirmMessage = document.getElementById("confirm-message")
  const confirmOk = document.getElementById("confirm-ok")
  const confirmCancel = document.getElementById("confirm-cancel")
  const confirmModalClose = document.getElementById("confirm-modal-close")

  const loadingIndicator = document.createElement("div")
  loadingIndicator.className = "loading-indicator"
  loadingIndicator.textContent = "Processing..."
  document.querySelector(".editor-wrapper").appendChild(loadingIndicator)

  const hljs = window.hljs

  const supportedLanguages = [
    { id: "javascript", name: "JavaScript" },
    { id: "typescript", name: "TypeScript" },
    { id: "kotlin", name: "Kotlin" },
    { id: "java", name: "Java" },
    { id: "python", name: "Python" },
    { id: "csharp", name: "C#" },
    { id: "cpp", name: "C++" },
    { id: "php", name: "PHP" },
    { id: "ruby", name: "Ruby" },
    { id: "go", name: "Go" },
    { id: "rust", name: "Rust" },
    { id: "html", name: "HTML" },
    { id: "css", name: "CSS" },
    { id: "json", name: "JSON" },
    { id: "xml", name: "XML" },
    { id: "markdown", name: "Markdown" },
    { id: "sql", name: "SQL" },
    { id: "bash", name: "Bash" },
    { id: "yaml", name: "YAML" },
    { id: "ini", name: "Conf (.conf)" },
    { id: "nbt", name: "NBT Format" },
    { id: "plaintext", name: "Plain Text" },
  ]

  let currentLanguage = "javascript"
  let isViewMode = false
  let currentUILanguage = "en"
  let highlightTimeout = null
  let isProcessing = false

  function populateLanguageGrid() {
    languageGrid.innerHTML = ""

    const searchTerm = languageSearch.value.toLowerCase()

    supportedLanguages.forEach((lang) => {
      if (searchTerm && !lang.name.toLowerCase().includes(searchTerm)) {
        return
      }

      const item = document.createElement("div")
      item.className = "language-item"
      if (lang.id === currentLanguage) {
        item.classList.add("active")
      }
      item.textContent = lang.name
      item.setAttribute("data-lang", lang.id)

      item.addEventListener("click", function () {
        const langId = this.getAttribute("data-lang")
        setLanguage(langId)
        closeModal(languageModal)
      })

      languageGrid.appendChild(item)
    })
  }

  function setLanguage(langId) {
    currentLanguage = langId

    const langName = supportedLanguages.find((l) => l.id === langId)?.name || langId
    selectedLanguage.textContent = langName

    updateHighlighting()
  }

  function openModal(modal) {
    overlay.classList.remove("hidden")
    modal.classList.remove("hidden")

    if (modal === languageModal) {
      languageSearch.value = ""
      populateLanguageGrid()
      languageSearch.focus()
    }
  }

  function closeModal(modal) {
    overlay.classList.add("hidden")
    modal.classList.add("hidden")
  }

  function showAlert(title, message, callback = null) {
    alertTitle.textContent = title
    alertMessage.textContent = message

    alertOk.onclick = () => {
      closeModal(alertModal)
      if (callback) callback()
    }

    openModal(alertModal)
  }

  function showConfirm(title, message, onConfirm, onCancel = null) {
    confirmTitle.textContent = title
    confirmMessage.textContent = message

    confirmOk.onclick = () => {
      closeModal(confirmModal)
      if (onConfirm) onConfirm()
    }

    confirmCancel.onclick = () => {
      closeModal(confirmModal)
      if (onCancel) onCancel()
    }

    openModal(confirmModal)
  }

  languageSelectBtn.addEventListener("click", () => {
    openModal(languageModal)
  })

  languageModalClose.addEventListener("click", () => {
    closeModal(languageModal)
  })

  alertModalClose.addEventListener("click", () => {
    closeModal(alertModal)
  })

  confirmModalClose.addEventListener("click", () => {
    closeModal(confirmModal)
  })

  languageSearch.addEventListener("input", () => {
    populateLanguageGrid()
  })

  codeEditor.addEventListener("scroll", () => {
    highlightedCode.scrollTop = codeEditor.scrollTop
    highlightedCode.scrollLeft = codeEditor.scrollLeft
  })

  codeEditor.addEventListener("input", () => {
    updateCounts()

    if (highlightTimeout) {
      clearTimeout(highlightTimeout)
    }

    const code = codeEditor.value
    if (code.length > 10000) {
      loadingIndicator.classList.add("show")
      isProcessing = true
    }

    highlightTimeout = setTimeout(
      () => {
        updateHighlighting()
        loadingIndicator.classList.remove("show")
        isProcessing = false
      },
      code.length > 10000 ? 500 : 100,
    ) 
  })

  codeEditor.addEventListener("paste", (e) => {
    let pastedText
    if (e.clipboardData && e.clipboardData.getData) {
      pastedText = e.clipboardData.getData("text/plain")
    }

    if (pastedText && pastedText.length > 10000) {
      e.preventDefault() 

      loadingIndicator.classList.add("show")
      isProcessing = true

      setTimeout(() => {
        const startPos = codeEditor.selectionStart
        const endPos = codeEditor.selectionEnd
        const beforeText = codeEditor.value.substring(0, startPos)
        const afterText = codeEditor.value.substring(endPos)

        codeEditor.value = beforeText + pastedText + afterText

        updateCounts()

        codeEditor.selectionStart = codeEditor.selectionEnd = startPos + pastedText.length

        if (highlightTimeout) {
          clearTimeout(highlightTimeout)
        }

        highlightTimeout = setTimeout(() => {
          updateHighlighting()
          loadingIndicator.classList.remove("show")
          isProcessing = false
        }, 500)
      }, 0)
    }
  })

  expirySelect.addEventListener("change", function () {
    expiryTime.textContent = this.value
  })

  saveBtn.addEventListener("click", saveCode)

  copyBtn.addEventListener("click", () => {
    copyToClipboard(codeEditor.value)
    showNotification(getTranslation("Code copied to clipboard!", "¡Código copiado al portapapeles!"))
  })

  newBtn.addEventListener("click", () => {
    if (codeEditor.value.trim() !== "") {
      showConfirm(
        getTranslation("Create New", "Crear Nuevo"),
        getTranslation(
          "Are you sure you want to create a new paste? Current changes will be lost.",
          "¿Estás seguro de que quieres crear un nuevo paste? Los cambios actuales se perderán.",
        ),
        resetEditor,
      )
    } else {
      resetEditor()
    }
  })

  copyLinkBtn.addEventListener("click", () => {
    copyToClipboard(shareLink.value)
    showNotification(getTranslation("Link copied to clipboard!", "¡Enlace copiado al portapapeles!"))
  })

  themeToggle.addEventListener("click", toggleTheme)

  languageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const lang = this.getAttribute("data-lang")
      setUILanguage(lang)
    })
  })

  forkBtn.addEventListener("click", () => {
    isViewMode = false
    viewModeBanner.classList.add("hidden")
    codeEditor.readOnly = false
    showNotification(getTranslation("Code forked! You can now edit it.", "¡Código bifurcado! Ahora puedes editarlo."))
  })


  function handleNBTFormat(code) {
    try {
      const result = hljs.highlight(code, { language: "json" })
      let html = result.value

      html = html.replace(/(\w+)b:/g, '<span class="hljs-attr">$1b</span>:') 
      html = html.replace(/(\w+)s:/g, '<span class="hljs-attr">$1s</span>:') 
      html = html.replace(/(\w+)l:/g, '<span class="hljs-attr">$1l</span>:') 
      html = html.replace(/(\w+)f:/g, '<span class="hljs-attr">$1f</span>:') 
      html = html.replace(/(\w+)d:/g, '<span class="hljs-attr">$1d</span>:') 
      html = html.replace(/(\d+)b/g, '<span class="hljs-number">$1b</span>') 
      html = html.replace(/(\d+)s/g, '<span class="hljs-number">$1s</span>') 
      html = html.replace(/(\d+)l/g, '<span class="hljs-number">$1l</span>') 
      html = html.replace(/(\d+)f/g, '<span class="hljs-number">$1f</span>') 
      html = html.replace(/(\d+)d/g, '<span class="hljs-number">$1d</span>') 

      html = html.replace(
        /\b(TAG_Compound|TAG_List|TAG_String|TAG_Int|TAG_Byte|TAG_Short|TAG_Long|TAG_Float|TAG_Double|TAG_End)\b/g,
        '<span class="hljs-keyword">$1</span>',
      )

      return html
    } catch (error) {
      return hljs.highlight(code, { language: "plaintext" }).value
    }
  }

  function updateHighlighting() {
    const code = codeEditor.value || ""

    if (code.length > 50000) {
      highlightedCode.textContent = code
      highlightedCode.className = "hljs"
      return
    }

    try {
      if (currentLanguage === "nbt") {
        highlightedCode.innerHTML = handleNBTFormat(code)
        highlightedCode.className = "hljs language-nbt"
        return
      }

      if (currentLanguage === "ini") {
        const result = hljs.highlight(code, { language: "ini" })
        highlightedCode.innerHTML = result.value
        highlightedCode.className = "hljs language-ini"
        return
      }

      const result = hljs.highlight(code, { language: currentLanguage })
      highlightedCode.innerHTML = result.value
      highlightedCode.className = `hljs language-${currentLanguage}`
    } catch (error) {
      highlightedCode.textContent = code
      highlightedCode.className = "hljs"
    }
  }

  function updateCounts() {
    const lines = codeEditor.value.split("\n").length
    lineCount.textContent = lines

    const chars = codeEditor.value.length
    charCount.textContent = chars
  }

  function isLocalStorageAvailable() {
    try {
      const test = "__storage_test__"
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  function saveCode() {
    const code = codeEditor.value
    if (!code.trim()) {
      showAlert(
        getTranslation("Error", "Error"),
        getTranslation("Please enter some code first!", "¡Por favor, introduce algo de código primero!"),
      )
      return
    }

    if (isProcessing) {
      showNotification(getTranslation("Please wait while processing...", "Por favor, espere mientras se procesa..."))
      return
    }

    if (!isLocalStorageAvailable()) {
      const fakeId = generatePasteId()
      const shareUrl = `${window.location.origin}?paste=${fakeId}`
      shareLink.value = shareUrl
      linkContainer.classList.remove("hidden")
      showNotification(
        getTranslation(
          "Code saved! Note: This link will not work in private browsing.",
          "¡Código guardado! Nota: Este enlace no funcionará en navegación privada.",
        ),
      )
      return
    }

    const pasteId = generatePasteId()

    const expiryMinutes = Number.parseInt(expirySelect.value)
    const expiryTime = Date.now() + expiryMinutes * 60 * 1000
    const createdTime = Date.now()

    const paste = {
      id: pasteId,
      code: code,
      language: currentLanguage,
      expiry: expiryTime,
      created: createdTime,
    }

    try {
      clearOldPastes()

      localStorage.setItem(`paste_${pasteId}`, JSON.stringify(paste))

      const shareUrl = `${window.location.origin}?paste=${pasteId}`
      shareLink.value = shareUrl
      linkContainer.classList.remove("hidden")

      setTimeout(
        () => {
          try {
            localStorage.removeItem(`paste_${pasteId}`)
          } catch (e) {
          }

          if (linkContainer.classList.contains("hidden") === false && shareLink.value.includes(pasteId)) {
            showAlert(
              getTranslation("Expired", "Expirado"),
              getTranslation("This paste has expired!", "¡Este paste ha expirado!"),
            )
            linkContainer.classList.add("hidden")
          }
        },
        expiryMinutes * 60 * 1000,
      )

      showNotification(getTranslation("Code saved successfully!", "¡Código guardado con éxito!"))
    } catch (error) {
      showAlert(
        getTranslation("Error", "Error"),
        getTranslation(
          "Error saving code. Try with a smaller code snippet.",
          "Error al guardar el código. Intente con un fragmento de código más pequeño.",
        ),
      )
    }
  }

  function clearOldPastes() {
    if (!isLocalStorageAvailable()) return

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("paste_")) {
          try {
            const paste = JSON.parse(localStorage.getItem(key))
            if (paste && paste.expiry && paste.expiry < Date.now()) {
              localStorage.removeItem(key)
            }
          } catch (e) {
            try {
              localStorage.removeItem(key)
            } catch (e) {
            }
          }
        }
      }
    } catch (e) {
    }
  }

  function copyToClipboard(text) {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand("copy")
      showNotification(getTranslation("Code copied to clipboard!", "¡Código copiado al portapapeles!"))
    } catch (err) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {
        })
      }
    }

    document.body.removeChild(textArea)
  }

  function showNotification(message, isError = false) {
    notificationMessage.textContent = message
    notification.classList.add("show")

    if (isError) {
      notification.classList.add("error")
    } else {
      notification.classList.remove("error")
    }

    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  function toggleTheme() {
    document.body.classList.toggle("light-theme")

    if (document.body.classList.contains("light-theme")) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>'
    }
  }

  function setUILanguage(lang) {
    currentUILanguage = lang

    languageOptions.forEach((option) => {
      if (option.getAttribute("data-lang") === lang) {
        option.classList.add("active")
      } else {
        option.classList.remove("active")
      }
    })

    document.querySelectorAll("[data-en]").forEach((el) => {
      el.textContent = getTranslation(el.getAttribute("data-en"), el.getAttribute("data-es"))
    })

    codeEditor.placeholder = getTranslation("Paste or type your code here...", "Pega o escribe tu código aquí...")

    languageSearch.placeholder = getTranslation("Search language...", "Buscar lenguaje...")

    document.querySelector("#language-modal .modal-header h3").textContent = getTranslation(
      "Select Language",
      "Seleccionar Lenguaje",
    )
  }

  function getTranslation(enText, esText) {
    return currentUILanguage === "en" ? enText : esText
  }

  function generatePasteId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  function resetEditor() {
    codeEditor.value = ""
    updateHighlighting()
    updateCounts()
    linkContainer.classList.add("hidden")
    viewModeBanner.classList.add("hidden")
    isViewMode = false
    codeEditor.readOnly = false
  }

  function formatTimeAgo(timestamp) {
    const now = Date.now()
    const seconds = Math.floor((now - timestamp) / 1000)

    if (seconds < 60) {
      return getTranslation("just now", "ahora mismo")
    }

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return minutes + " " + getTranslation("minutes ago", "minutos atrás")
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return hours + " " + getTranslation("hours ago", "horas atrás")
    }

    const days = Math.floor(hours / 24)
    return days + " " + getTranslation("days ago", "días atrás")
  }

  function checkForPasteInUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    const pasteId = urlParams.get("paste")

    if (pasteId && isLocalStorageAvailable()) {
      try {
        const pasteData = localStorage.getItem(`paste_${pasteId}`)

        if (pasteData) {
          try {
            const paste = JSON.parse(pasteData)

            if (paste.expiry < Date.now()) {
              showAlert(
                getTranslation("Expired", "Expirado"),
                getTranslation("This paste has expired!", "¡Este paste ha expirado!"),
              )
              try {
                localStorage.removeItem(`paste_${pasteId}`)
              } catch (e) {
              }
              return
            }

            if (paste.code.length > 10000) {
              loadingIndicator.classList.add("show")
            }

            setTimeout(
              () => {
                codeEditor.value = paste.code

                if (paste.language) {
                  currentLanguage = paste.language
                  const langName = supportedLanguages.find((l) => l.id === paste.language)?.name || paste.language
                  selectedLanguage.textContent = langName
                }

                updateHighlighting()
                updateCounts()

                const remainingMs = paste.expiry - Date.now()
                const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))

                expiryTime.textContent = remainingMinutes

                const shareUrl = `${window.location.origin}?paste=${pasteId}`
                shareLink.value = shareUrl
                linkContainer.classList.remove("hidden")

                viewModeBanner.classList.remove("hidden")
                if (paste.created) {
                  sharedTime.textContent = formatTimeAgo(paste.created)
                }
                isViewMode = true
                codeEditor.readOnly = true

                loadingIndicator.classList.remove("show")
              },
              paste.code.length > 10000 ? 100 : 0,
            )
          } catch (error) {
            showAlert(
              getTranslation("Error", "Error"),
              getTranslation("Error loading paste.", "Error al cargar el paste."),
            )
            loadingIndicator.classList.remove("show")
          }
        } else {
          showAlert(
            getTranslation("Not Found", "No Encontrado"),
            getTranslation("Paste not found or has expired!", "¡Paste no encontrado o ha expirado!"),
          )
        }
      } catch (e) {
        showAlert(getTranslation("Error", "Error"), getTranslation("Error loading paste.", "Error al cargar el paste."))
      }
    }
  }

  window.addEventListener("resize", () => {
    highlightedCode.scrollTop = codeEditor.scrollTop
    highlightedCode.scrollLeft = codeEditor.scrollLeft
  })

  setLanguage("plaintext")
  updateCounts()
  setUILanguage("en")

  checkForPasteInUrl()
})
