Set objFSO = CreateObject("Scripting.FileSystemObject")
objStartFolder = ".\Uploads"

Set objFolder = objFSO.GetFolder(objStartFolder)

If Not objFSO.FolderExists(".\Uploads\Accounts") Then 
    objFSO.CreateFolder(".\Uploads\Accounts")
end if

If Not objFSO.FolderExists(".\Uploads\Contacts") Then 
    objFSO.CreateFolder(".\Uploads\Contacts")
end if

If Not objFSO.FolderExists(".\Uploads\Teams") Then 
    objFSO.CreateFolder(".\Uploads\Teams")
end if

Set colDirs = objFolder.SubFolders
For Each subFolder in colDirs

    if IsNumeric(subFolder.Name) then
        ' migrate photo gallery
        If objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\PhotoGallery") Then 
            Set photoFolders = objFSO.GetFolder(".\Uploads\" + subFolder.Name + "\PhotoGallery")
            Set photoFiles = photoFolders.Files
            For Each photoFile in photoFiles
                ' get the id
                id = 0
                newFileName = ""
                if InStr(photoFile.Name, "PhotoGallery.jpg") > 0 then
                    id = Replace(photoFile.Name, "PhotoGallery.jpg", "")
                    newFileName = "PhotoGallery.jpg"
                elseif InStr(photoFile.Name, "PhotoGalleryThumb.jpg") > 0 then
                    id = Replace(photoFile.Name, "PhotoGalleryThumb.jpg", "")
                    newFileName = "PhotoGalleryThumb.jpg"
                end if

                if id <> 0 then
                    If Not objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\PhotoGallery\" + id) Then 
                        objFSO.CreateFolder(".\Uploads\" + subFolder.Name + "\PhotoGallery\" + id)
                    end if

                    objFSO.MoveFile ".\Uploads\" + subFolder.Name + "\PhotoGallery\" + photoFile.Name, ".\Uploads\" + subFolder.Name + "\PhotoGallery\" + id + "\" + newFileName
                end if 

            Next 
        end if

        Set accountFiles = subFolder.Files
        If Not objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\Sponsors\") Then 
            objFSO.CreateFolder(".\Uploads\" + subFolder.Name + "\Sponsors\")
        end if
        If Not objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\Handouts\") Then 
            objFSO.CreateFolder(".\Uploads\" + subFolder.Name + "\Handouts\")
        end if

        For Each accountFile in accountFiles
            if InStr(accountFile.Name, "SponsorLogo.png") > 0 then
                ' get the id
                id = Replace(accountFile.Name, "SponsorLogo.png", "")
                If Not objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\Sponsors\" + id) Then 
                    objFSO.CreateFolder(".\Uploads\" + subFolder.Name + "\Sponsors\" + id)
                end if

                objFSO.MoveFile ".\Uploads\" + subFolder.Name + "\" + accountFile.Name, ".\Uploads\" + subFolder.Name + "\Sponsors\" + id + "\SponsorLogo.png"  

            Elseif InStr(accountFile.Name, "handout") > 0 then
                ' get the id
                id = Replace(accountFile.Name, "handout", "")
                If Not objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\Handouts\" + id) Then 
                    objFSO.CreateFolder(".\Uploads\" + subFolder.Name + "\Handouts\" + id)
                end if

                objFSO.MoveFile ".\Uploads\" + subFolder.Name + "\" + accountFile.Name, ".\Uploads\" + subFolder.Name + "\Handouts\" + id + "\handout"  

            end if

        Next

        If objFSO.FolderExists(".\Uploads\" + subFolder.Name + "\Teams") Then 
            Set teamsFolders = objFSO.GetFolder(".\Uploads\" + subFolder.Name + "\Teams")
            Set teamSubFolders = teamsFolders.SubFolders
            For Each teamFolder in teamSubFolders
                objFSO.MoveFolder ".\Uploads\" + subFolder.Name + "\Teams\" + teamFolder.Name, ".\Uploads\Teams\" + teamFolder.Name
            Next 
        end if

        objFSO.MoveFolder ".\Uploads\" + subFolder.Name, ".\Uploads\Accounts\" + subFolder.Name 
    end if
Next

Set colFiles = objFolder.Files
For Each objFile in colFiles

    if InStr(objFile.Name, "ContactPhoto.jpg") > 0 then
        ' get the id
        id = Replace(objFile.Name, "ContactPhoto.jpg", "")
        If Not objFSO.FolderExists(".\Uploads\Contacts\" + id) Then 
            objFSO.CreateFolder(".\Uploads\Contacts\" + id)
        end if

        objFSO.MoveFile ".\Uploads\" + objFile.Name, ".\Uploads\Contacts\" + id + "\ContactPhoto.jpg"  
    Elseif InStr(objFile.Name, "ContactActionPhoto.jpg") > 0 then
        ' get the id
        id = Replace(objFile.Name, "ContactActionPhoto.jpg", "")
        If Not objFSO.FolderExists(".\Uploads\Contacts\" + id) Then 
            objFSO.CreateFolder(".\Uploads\Contacts\" + id)
        end if

        objFSO.MoveFile ".\Uploads\" + objFile.Name, ".\Uploads\Contacts\" + id + "\ContactActionPhoto.jpg"  
    end if
Next

WScript.echo 'TODO: Rename handouts!'
WScript.echo 'Re-add team logos, gif changed to jpg'