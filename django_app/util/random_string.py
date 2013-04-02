from random import choice
import string

def GenString(length=8):
    chars=string.letters + string.digits
    newstring=""
    for i in range(length):
        newstring = newstring + choice(chars)
    return newstring 