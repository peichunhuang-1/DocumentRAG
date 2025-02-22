APP Development
===
Environment
---
### 1. Install node js

```
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install nodejs
```

### 2. Initial vite and electron framework

```
    mkdir your-workspace && cd your-workspace
    npm create electron-vite@latest DocumentRAG
    cd DocumentRAG
    npm install
```

### 3. Install essential

``` 
    npm install openai
    npm install chromadb
    npm install ollama
```

### 4. Install Ollama

    Download from link: https://ollama.com

### 5. Install Chroma
    
```
    pip install chromadb
    mkdir -p ~/.chromadb
    chroma run --path ${HOME}/.chromadb
```

### 6. Pull model from ollama and add ModelFile

```
    ollama pull llama3
    mkdir -p ~/.ollama/modelfile
    vim ~/.ollama/modelfile/ModelFile
    ollama create llama3-tuned -f Modelfile
```

``` ModelFile
    # ModelFile
    FROM llama3:latest
    SYSTEM """instruction or identity here"""
```

```
    ollama list
    ollama run llama3-tuned
```

Project Framework
---

#### React UI Layer
___
##### - User prompts
##### - Other operations (Download files...)

#### Electron Main Layer (Backend)
---
##### - User prompts -> ChromaDB -> Retrieved Data
##### - Retrieved Data + User prompts -> Llama3 (tuned) -> Response
##### - Response -> React UI Layer
##### - Hidden Layer (ChromaDB Server)

UI Layout Design
---

![alt text](./figures/Layout.png "Layout")

Interfaces
---

### Prompting

#### UploadFile: Button
Upload file from local to chromadb.
___

#### SearchOnInternet: ToggleButton
If toggled, LLM will search the prompt on internet, and give some advice.
___

#### ReferenceSettings: DropdownMenu
Choose the data source as reference.
___

#### PromptText: InputTextBox
Input the prompt.
___

#### ResponseText: TextBox
Show response from LLM.
___

### Indicator

#### ShowText: TextBox
Show reference paragraph.
___

#### ShowFigure: FigureBox
Show reference figure.
___

#### ShowReference: LocalLink
Show source link to local file location.
___

### Searching Result

#### ResultList: ItemList
Browser page, show item that directly search on search engine.
___

#### ResultItem: LocalLink \ RemoteLink
Website link, or local file link.
___

### Header

#### SearchBox: InputTextBox
Searching input.
___

#### Signin: Button
User registration for seperating chromadb storage location.
___

#### Login: Button
Login to access the correct chromadb storage.
___

#### About: Button
About this app.
___

#### Help: Button
Help message.
___

#### Logo: Icon
Logo for this app.
___