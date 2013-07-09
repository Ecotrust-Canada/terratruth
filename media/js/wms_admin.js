
$(document).ready(function() {
  if($('textarea#id_style').length > 0)
  {
    $('textarea#id_style').hide();
    var styletxt = $('textarea#id_style').text();
    if (styletxt.trim() == '')
        styletxt = '{}';
    var style = eval('(' + styletxt + ')');
    if (!style.WIDTH)
        style.WIDTH = '1';
    var html = '<br/><div style="float:left;">COLOR:<br/><form><input type="text" id="COLOR" name="COLOR" value="' + style.COLOR + '" /></form><div id="COLORPicker"></div></div>';
    html += '<div style="float:left; margin-left:20px;">OUTLINECOLOR:<br/><form><input type="text" id="OUTLINECOLOR" name="OUTLINECOLOR" value="' + style.OUTLINECOLOR + '" /></form><div id="OUTLINECOLORPicker"></div></div>';
    html += '<div style="float:left; margin-left:20px;">WIDTH:<br/><select class="styleinput" id="WIDTH"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option></select></div>';
    html += '<div style="float:left; margin-left:20px;"><ul><li>choose a color from the color chooser. color text will updated accordingly.</li><li>remove the color text to have no color.</li><li>width is also used for point size</li></ul></div>';
    
    $('textarea#id_style').after(html);
    
    COLORPicker = $.farbtastic('#COLORPicker', function(color) {
        if (color.trim() != '')
        {
            $('#COLOR').val(color);
            $('#COLOR').css('background-color', color);
            style.COLOR = color;
            $('textarea#id_style').text(JSON.stringify(style));
        }
    });
    
    OUTLINECOLORPicker = $.farbtastic('#OUTLINECOLORPicker', function(color) {
        if (color.trim() != '')
        {
            $('#OUTLINECOLOR').val(color);
            $('#OUTLINECOLOR').css('background-color', color);
            style.OUTLINECOLOR = color;
            $('textarea#id_style').text(JSON.stringify(style));
        }
    });

    COLORPicker.setColor(style.COLOR);
    OUTLINECOLORPicker.setColor(style.OUTLINECOLOR);
    $('#WIDTH').attr('value', style.WIDTH);

    $('#COLOR').bind('keyup change', function (){
        val = $(this).val().trim();
        if (val != '')
            COLORPicker.setColor($(this).val());
        else
        {
            style.COLOR = '';
            $('#COLOR').css('background-color', 'white');
            $('textarea#id_style').text(JSON.stringify(style));
        }
    });
    $('#OUTLINECOLOR').bind('keyup change', function (){
        val = $(this).val().trim();
        if (val != '')
            OUTLINECOLORPicker.setColor($(this).val());
        else
        {
            style.OUTLINECOLOR = '';
            $('#OUTLINECOLOR').css('background-color', 'white');
            $('textarea#id_style').text(JSON.stringify(style));
        }
    });

    $('.styleinput').change(function (){
        style[$(this).attr('id')] = $(this).val();
        $('textarea#id_style').text(JSON.stringify(style));
    });
  
  }

  if($('textarea#id_label_style').length > 0)
  {
    $('textarea#id_label_style').hide();
    var labelstyletxt = $('textarea#id_label_style').text();
    if (labelstyletxt.trim() == '')
        labelstyletxt = '{}';
    var labelstyle = eval('(' + labelstyletxt + ')');
    if (!labelstyle.COLOR)
        labelstyle.COLOR = '#ffffff';
    if (!labelstyle.SIZE)
        labelstyle.SIZE = '9';
    if (!labelstyle.FONT)
        labelstyle.FONT = 'calibri';
    $.get('/getfonts/', function (data) {
        data = JSON.parse(data);
        var html = '<div id="label_style_div"><br/><div style="float:left;">COLOR:<br/><form><input type="text" id="LABELCOLOR" name="LABELCOLOR" value="' + labelstyle.COLOR + '" /></form><div id="LABELCOLORPicker"></div></div>';
        html += '<div style="float:left; margin-left:20px;">SIZE:<br/><select class="labelstyleinput" id="SIZE"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option></select></div>';
        html += '<div style="float:left; margin-left:20px;">FONT:<br/><select class="labelstyleinput" id="FONT">';
        for (i in data.fonts)
            html += '<option value="' + data.fonts[i] +'">' + data.fonts[i] + '</option>';
        html += '</select></div></div>';
        $('textarea#id_label_style').after(html);

        LABELCOLORPicker = $.farbtastic('#LABELCOLORPicker', function(color) {
            $('#LABELCOLOR').val(color);
            $('#LABELCOLOR').css('background-color', color);
            labelstyle.COLOR = color;
            $('textarea#id_label_style').text(JSON.stringify(labelstyle));
        });
    
        LABELCOLORPicker.setColor(labelstyle.COLOR);
        $('#SIZE').attr('value', labelstyle.SIZE);
        $('#FONT').attr('value', labelstyle.FONT);

        $('#LABELCOLOR').change(function (){
            LABELCOLORPicker.setColor($(this).val());
        });

        $('.labelstyleinput').change(function (){
            labelstyle[$(this).attr('id')] = $(this).val();
            $('textarea#id_label_style').text(JSON.stringify(labelstyle));
        });

        if (!$('#id_label_field_name').val())
            $('#label_style_div').hide();

        $('#id_label_field_name').change(function () {
            if ($('#id_label_field_name').val())
                $('#label_style_div').show();
            else
                $('#label_style_div').hide();
        });

    });
    
  }

});
