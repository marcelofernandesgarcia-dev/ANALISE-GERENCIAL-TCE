# ANÁLISE GERENCIAL TCE

Este repositório contém a automação para padronização e geração do dashboard interativo da Análise Gerencial do Ministério do Turismo (MTur) com foco nas transferências governamentais do TCE.

O pipeline é executado localmente, limpando as colunas de dados textuais e atualizando o dashboard visual automaticamente.

---

## 📁 Estrutura de Pastas

*   `planilha/`: Diretório onde a planilha do Excel (com extensão `.xlsx` ou `.xltx`) deve ser inserida.
    *   `planilha/backups/` (gerado automaticamente): Contém os backups das planilhas anteriores antes de serem limpas.
*   `executar_ajustes.py`: Script Python principal que executa a limpeza dos textos e atualiza as estatísticas do Dashboard.
*   `executar.bat`: Arquivo executável de dois cliques para usuários do Windows.
*   `dashboard_template.html`: Template visual em modo escuro (Slate Dark Mode).
*   `dashboard.html`: Arquivo do Dashboard interativo gerado na pasta do projeto.
*   `C:\Users\Mtur.gov\Downloads\dashboard.html`: Cópia do Dashboard compilado enviada diretamente para sua pasta de Downloads para fácil abertura.

---

## ⚡ Como Atualizar a Planilha (Rotina de 15 Dias)

Sempre que uma nova planilha for exportada:

1.  **Substitua a planilha antiga:** Copie o novo arquivo `.xlsx` ou `.xltx` para a pasta `planilha/` dentro do projeto.
    *   *Dica: Você não precisa renomear a planilha. O script identificará automaticamente a planilha mais recente e maior para compilar os dados.*
2.  **Execute o script:** Dê um duplo clique no arquivo `executar.bat`.
3.  **Verifique o resultado:**
    *   O console do prompt de comando mostrará o progresso e confirmará o sucesso.
    *   Acesse o dashboard em sua pasta de Downloads ou abra o arquivo `C:\Users\Mtur.gov\Downloads\dashboard.html` no seu navegador (Chrome, Edge, Firefox).

---

## 🛠️ Requisitos Técnicos

Caso precise rodar em um novo computador:
1. Instale o Python (versão 3.8 ou superior).
2. Instale a biblioteca `openpyxl` executando o comando no terminal do projeto:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🐙 Como Salvar e Atualizar no GitHub

Como você já está logado no seu GitHub, siga os passos abaixo para enviar e manter este repositório atualizado:

### 1. Criar o repositório no GitHub
1. Acesse o seu [GitHub](https://github.com/) (como `marcelofernandesgarcia-dev`).
2. Clique no botão verde **"Novo"** (New) no canto superior esquerdo ou vá em [github.com/new](https://github.com/new).
3. Preencha o nome do repositório exatamente como: **`ANALISE GERENCIAL TCE`**.
4. Configure como **Privado** ou **Público** (conforme sua necessidade de segurança dos dados) e **NÃO** marque as caixas para adicionar README, .gitignore ou Licença (pois já criamos esses arquivos localmente).
5. Clique em **"Criar repositório"** (Create repository).

### 2. Vincular o repositório local e fazer o Push (Primeira vez)
Abra o terminal (PowerShell ou CMD) na pasta deste projeto e execute os seguintes comandos:

```bash
# Inicializar o git local
git init

# Adicionar todos os arquivos
git add .

# Realizar o primeiro commit local
git commit -m "Initial commit: Reorganização de pastas e pipeline de atualização automática"

# Renomear o branch principal para main
git branch -M main

# Associar ao seu repositório do GitHub (Substitua pelo URL gerado na página do GitHub)
git remote add origin https://github.com/marcelofernandesgarcia-dev/ANALISE-GERENCIAL-TCE.git

# Enviar os arquivos para o GitHub
git push -u origin main
```

### 3. Para atualizar no GitHub no futuro (Caso modifique os scripts)
Sempre que fizer alterações nos códigos e quiser salvar no GitHub:
```bash
git add .
git commit -m "Atualização dos dados/scripts"
git push
```
