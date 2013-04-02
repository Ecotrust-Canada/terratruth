#!/usr/bin/python

import sys
import os
import settings

group_to_load = 'all'

# Check if we should only load one group
if len(sys.argv) > 1:
    group_to_load = sys.argv[1]

GIS_DATA_DIR = '/projects/amndss/gis_data/postgis_load/'

# Defines gis layer groups and their gis layers. 
# Each layer is in the form [filename,table name,<encoding>]

groups = {
    'haida':[
        ['All_Conservancies_Dissolve','bd_haida_all_conservancies', 'LATIN1'], 
        ['LUP_protected_areas','bd_haida_lup_protected_areas', 'LATIN1'],
        ['BIO_black_bear','bd_haida_bio_black_bear'],
        ['BIO_forested_swamps','bd_haida_bio_forested_swamps'],
        ['BIO_HVFH_Dissolve','bd_haida_bio_hvfh'],
        ['BIO_NHVFH_Dissolve','bd_haida_bio_nhvfh'],
        ['BIO_rare_old_ecosystems','bd_haida_bio_rare_old_ecosystems'],
        ['BIO_rare_plants','bd_haida_bio_rare_plants'],
        ['BIO_WHA','bd_haida_bio_wha'],
        ['DEV_fsp','bd_haida_dev_fsp'],
        ['CULT_cmts','bd_haida_cmts', 'LATIN1'],
        ['CULT_monumentals0203','bd_haida_cult_monumentals0203', 'LATIN1'],
        ['CULT_monumentals04','bd_haida_cult_monumentals04'],
        ['CULT_monumentals_CIN','bd_haida_cult_monumentals_CIN', 'LATIN1'],
        ['CULT_placenames1','bd_haida_cult_placenames1', 'LATIN1'],
        ['CULT_placenames2','bd_haida_cult_placenames2', 'LATIN1'],
        ['CULT_placenames3','bd_haida_cult_placenames3', 'LATIN1'],
        ['CULT_plants','bd_haida_cult_plants'],
        ['CULT_reg_arch_sites','bd_haida_cult_reg_arch_sites'],
        ['CULT_wood','bd_haida_cult_wood'],
        ['HYDRO_watersheds','bd_haida_hydro_watersheds'],
        ['TOPO_terrain','bd_haida_topo_terrain'],
        ['HG_Coastline','bd_haida_boundary'] # this is loaded for extents purposes, but does not need to be in the map file
                           
    ],
    'lilwat':[
        ['cma','bd_lilwat_cma'],
        ['commercial_rec_app','bd_lilwat_commercial_rec_app'],
        ['commercial_recreation_interest_areas','bd_lilwat_commercial_recreation_interest_areas'],
        ['conservancy','bd_lilwat_conservancy'],
        ['fc','bd_lilwat_fc'],
        ['forest_cover','bd_lilwat_forest_cover'],
        ['lakes_poly','bd_lilwat_lakes_poly'],
        #['LNLUP_landusedesignations_public','bd_lilwat_lnlup_landusedesignations_public'],
        ['s2s_cr_tens','bd_lilwat_s2s_cr_tens'],
        ['slrd_roads','bd_lilwat_slrd_roads'],
        ['river_line','bd_lilwat_river_line'],
        ['roads_final','bd_lilwat_roads_final'],
        ['wildlands','bd_lilwat_wildlands'],
        ['t_model_cmt_dissolve','bd_lilwat_t_model_cmt_dissolve'],
        ['t_model_habitat_dissolve','bd_lilwat_t_model_habitat_dissolve'],
        ['OGMA','bd_lilwat_ogma'],
        ['arch_raad_22006','bd_lilwat_arch_raad'],
        ['CulturalProtectionAreas_R080124','bd_lilwat_cultural_protection_areas'],
        ['lilwt_bndln_Poly','bd_lilwat_boundary']
    ],
    'ona':[
        ['ONA_TerritoryBound','bd_ona_boundary'],
        ['ground_water_aquifer','bd_ona_ground_water_aquifers'],
        ['forested-wetlands-3NTS-sheets','bd_ona_forested_wetlands'],
        ['Forest_Tenure_Cut_Blocks_16mar09','bd_ona_forest_tenure_cut_blocks'],
        ['ONA_ArcSites','bd_ona_archaeology_sites'],
        ['Placename_06_2008pt_BCAlbers','bd_ona_place_name_2008'],
        ['Coyote_Landmarks_BC_Albers','bd_ona_coyote_landmarks']
    ],
    'heiltsuk':[
        ['landuse_0806','bd_heiltsuk_landuse_0806']
    ],
    'general':[
        ['reserves_2005_bc', 'bd_general_reserves_2005'],           
        ['bc_parks_2008', 'bd_general_bc_parks'],           
        ['amn_users', 'bd_general_amn_users', 'LATIN1'],           
        ['s2s_lrmp_complete', 'bd_general_s2s_lrmp_complete', 'LATIN1'],
        ['OGMA_LEG_C', 'bd_general_bc_ogma_legal'],
        ['OGMA_NLEGC', 'bd_general_bc_ogma_not_legal']
    ]
          }

for group, layers in groups.items():
    
    if group_to_load != 'all' and group != group_to_load:
        continue

    for layer in layers:
        filename = None
        tablename = None
        encoding = None
        if len(layer) == 2:
            [filename,tablename] = layer
        else:
            [filename, tablename, encoding] = layer
            
        if encoding:
            command = 'sudo su -c "/usr/local/pgsql_8_2_6/bin/shp2pgsql -s 3005 -W '+encoding+' -I '+GIS_DATA_DIR+group+'/'+filename+'.shp '+tablename+'" postgres | /usr/local/pgsql_8_2_6/bin/psql -U amndss -d '+settings.DATABASE_NAME+' '
        else:
            command = 'sudo su -c "/usr/local/pgsql_8_2_6/bin/shp2pgsql -s 3005 -I '+GIS_DATA_DIR+group+'/'+filename+'.shp '+tablename+'" postgres | /usr/local/pgsql_8_2_6/bin/psql -U amndss -d '+settings.DATABASE_NAME+' '
            
        print ''
        print command
        print ''
        os.system(command)
        
