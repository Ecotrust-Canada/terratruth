def file_extension(filename):
    pos = filename.rfind('.')
    if pos > -1:
        return filename[pos+1:]
    else:
        return None
