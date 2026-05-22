@echo off
chcp 65001 > nul
echo Iniciando atualização da Análise Gerencial TCE...
python "%~dp0executar_ajustes.py"
echo.
echo Processo concluído! Pressione qualquer tecla para fechar esta janela.
pause > nul
