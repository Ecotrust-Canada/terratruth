from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext

from referrals.models import *
from util.amn_map import *
import simplejson
from amndssprint import AMNPdf
import pickle

import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

@login_required
def index(request):

    # prepare mapserver temp directory
    import os, os.path
    if not os.path.exists('/tmp/ms_temp'):
      os.popen('mkdir /tmp/ms_temp')

    import pprint
    pp = pprint.PrettyPrinter(indent=4)
    fields = {}
    fp = None
    imagefilename = None
    response = HttpResponse()

    form = request.POST
    if form.has_key('request'):
        fields['request'] = form['request']
    else:
        fields['request'] = ""
    if fields['request'] == 'print':
        for field in ['title','type','responsetype','description','confidential']:
            fields[field] = form.get(field,None)
        if form.has_key('oldata'):
            fields['oldata'] = simplejson.loads(form['oldata'])
        if form.has_key('legendimages'):
            fields['legendimages'] = simplejson.loads(form['legendimages'])
        if form.has_key('upload') and hasattr(form['upload'],'file'):
            import os
            [tempFile,tempFilePath] = tempfile.mkstemp(dir='/tmp/',suffix='.jpg')
            imagefilename = tempFilePath
            fout = file(imagefilename, 'wb')
            raise Exception(imagefilename)
            while 1:
                chunk = form['upload'].file.read()
                if not chunk: break
                fout.write(chunk)
            fout.close()
    elif fields['request'] == 'report':
        fields['responsetype'] = form['responsetype']
        fields['data'] = form['data']
        
    #[cvo] pickle config for server side testing.
    #pickle.dump(fields, open('/tmp/fields.pkl','w'))
    
    # TODO: add this error handling back at some point.
    #except:
    #    request.content_type = 'text/html'
    #    raw_message = ''.join(['%s:%s,' % pair for pair in fields.items()])
    #    request.write('{"post_dat_bad":' + raw_message + '}')
    #    return

    #Perform the request
    request = ""
    if fields.has_key('request'):
        request = fields['request']

    if request == 'print' and \
            (fields.has_key('type') and fields.has_key('responsetype') and \
                 fields.has_key('oldata') and fields.has_key('title') and fields.has_key('description')):
        # Check that all required params are there:

        responseType = fields['responsetype']
        olData = fields['oldata']
        logging.debug(fields)
        imageGenerator = AmnMap(fields)
        pdfObject = AMNPdf(fields,imagefilename)
        (pdffile,pdfdata) = pdfObject.createPdf(imageGenerator)
        if responseType == 'url':
            response['Content-Type'] = 'text/html'                                                           
            #if olData:
            #    response.write('{\"url\":\"'+pdffile+'\",\"oldata\":'+simplejson.dumps(olData)+'}')
            #else:
            response.write('{\"url\":\"'+pdffile+'\"}')
        else:
            response['Content-Type'] = 'application/pdf'
            response.write(pdfdata)

    elif request == 'report' and \
            (fields.has_key('data') and fields.has_key('responsetype')):
        responseType = fields['responsetype']
        olData = fields['data']
        [tempFile,tempFilePath] = tempfile.mkstemp(dir='/tmp/')
        file_name = tempFilePath
        new_file = open(file_name, 'w')
        new_file.write(olData)
        new_file.close()
        if responseType == 'url':
            response['Content-Type'] = 'text/plain'
            response.write('{\"url\":\"'+file_name+'\"}')
    elif request == 'test': 
        req.content_type = 'text/plain'
        req.write('{\"resp\": \"Test request recieved\"')
        olData = fields.getfirst('oldata')
        if olData:
            response.write(',orig:' + olData + '}')
        else:
            response.write('}')
    else:
        response['Content-Type'] = 'text/plain'
        response.write('Print Server Alive - please send a request param')
    return response
