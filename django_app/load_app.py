createdb -U postgres -T template_postgis cobi
python manage.py syncdb --noinput
./runpy add_merc.py
./runpy load_gis_layers.py 