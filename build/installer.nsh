!macro customInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Desea limpiar la base de datos y comenzar con una base de datos limpia desde cero?" IDNO +2
    RMDir /r "$APPDATA\Distribuidora"
!macroend

!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Desea eliminar la base de datos y todos los datos guardados de la aplicación?" IDNO +2
    RMDir /r "$APPDATA\Distribuidora"
!macroend
