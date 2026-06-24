!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Desea eliminar la base de datos y todos los datos guardados de la aplicación?" IDNO +2
    RMDir /r "$APPDATA\distribuidora"
!macroend
