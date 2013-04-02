ref_mgr = {
    'public_report':[[
            {
                'table':'bd_general_reserves_2005',
                'title':'BC - First Nations Reserves',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_bc_ogma_legal',
                'title':'Old Growth Forest Management Areas (Legal)',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_bc_ogma_not_legal',
                'title':'Old Growth Forest Management Areas (Not Legal)',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_bc_parks',
                'title':'BC - Parks',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_bec',
                'title':'BC - Biogeoclimatic Zones',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_gw_well_capture_zone',
                'title':'BC - Ground Water Well Capture Zones',
                'area_units':'sq. km'  
            }
        ] , [
            {
                'title':'What is the size of the proposed Land Use Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Land Use Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
               'title':'Is the proposed Land Use Activity area within a First Nations Reserve?',
               'header1':'BAND',
               'header2':'AREA IN HECTARES',
               'sql':"""SELECT distinct((cr.band || ', ' || cr.ir_name)) as BANDRESERVE,
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_reserves_2005 as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY (cr.band || ', ' || cr.ir_name)"""
            },{
                'title':'What Biogeoclimactic Classifications does the proposed Land Use Activity intersect with?',
                'header1':'CLASSIFICATION',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct((coalesce(zone_name, '') || ' ' || coalesce(sbznnm, '') || ' ' || coalesce(vrntnm, '') || ' ' || coalesce(phase_name, ''))) as CLASSIFICATION, 
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_bec as cr, 
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY (coalesce(zone_name, '') || ' ' || coalesce(sbznnm, '') || ' ' || coalesce(vrntnm, '') || ' ' || coalesce(phase_name, ''))"""
            },{
                'title':'Does the proposed Land Use Activity intersect with any BC Parks?',
                'header1':'PARK NAME',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(pa_name), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_bc_parks as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.pa_name"""
            },{
                'title':'Does the proposed Land Use Activity intersect with any Legal Old Growth Forest Management Areas?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'LEGAL', 
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_bc_ogma_legal as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Does the proposed Land Use Activity intersect with any Non-legal Old Growth Forest Management Areas?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'NOT LEGAL',
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_bc_ogma_not_legal as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Does the proposed Land Use Activity intersect with any mapped Ground Water Well Capture Zones?',
                'header1':'WELL TAG',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(well_tag),
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_gw_well_capture_zone as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.well_tag"""
            },{
                'title':'Does the proposed Land Use Activity intersect with any mapped Ground Water Aquifers?',
                'header1':'VULNERABILITY',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(vulnrablty),
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_gw_aquifer as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.vulnrablty"""
            },{
                'title':'What type of Ground Water Wells are the proposed Land Use Activity?',
                'header1':'USE',
                'header2':'COUNT',
                'sql':"""select wllsnm, count(*) \
                         FROM bd_general_gw_well as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.wllsnm
                         ORDER BY count(*)"""
            }
        ]],
    'lilwat_rec_report':[[
            {
                'table':'bd_general_s2s_lrmp_complete',
                'title':'Wildlands',
                'area_units':'sq. km',
                'where_clause':' and land_use = ''Wildlands'''
            },{
                'table':'bd_general_s2s_lrmp_complete',
                'title':'Front Country',
                'area_units':'sq. km',  
                'where_clause':' and land_use = ''Front Country Area'''
            },{
                'table':'bd_general_s2s_lrmp_complete',
                'title':'Conservancy',
                'area_units':'sq. km',  
                'where_clause':' and land_use = ''Conservancy'''
            },{
                'table':'bd_general_s2s_lrmp_complete',
                'title':'Cultural Management Areas',
                'area_units':'sq. km',  
                'where_clause':' and land_use = ''Cultural Management Area'''  
            },{
                'table':'bd_lilwat_commercial_recreation_interest_areas',
                'title':'Commercial Recreation Withdrawals',
                'area_units':'sq. km'  
            },{
                'table':'bd_general_reserves_2005',
                'title':'Reservation Lands (2005)',
                'area_units':'sq. km'  
            },{
                'table':'bd_lilwat_commercial_rec_app',
                'title':'Commercial Recreation Applications',
                'area_units':'sq. km'  
            }
        ],[
            {
                'title':'What is the size of the proposed Land Use Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Land Use Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
                'title':'How much high/moderate Culturally Modified Tree Potential is within the proposed Land Use Activity area?',
                'header1':'CMP CLASS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(cmtclass) as cmtclass, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_t_model_cmt_dissolve as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.cmtclass"""
            },{
                'title':'How much known high/moderate Habitat potential is within the proposed Land Use Activity area',
                'header1':'HABITAT CLASS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(habclass) as habclass, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_t_model_habitat_dissolve as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.habclass"""
            },{
                'title':'Are there any known archaeological sites in the proposed Land Use Activity area (recorded and unrecorded)?',
                'header1':'STATUS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(cr.reg_status) as status, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_arch_raad as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.reg_status"""
            },{
                'title':'Are there any known traditional use zones in the proposed Land Use Activity area?',
                'header1':'TRADITIONAL USE',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(cr.type) as type, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_lup_protection_areas as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.type"""
            },{
                'title':'What Sea to Sky LUP Zones does the proposed Land Use Activity area intersect with?',
                'header1':'LAND USE',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(land_use) as land_use, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_s2s_lrmp_complete as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.land_use"""
            },{
                'title':'What Land Use Plan Designations does the proposed Land Use Activity area intersect with?',
                'header1':'DESIGNATION',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(lutype) as lnlup_landusedesignations, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_lnlup_landusedesignations_public as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.lutype"""
            },{
                'title':'Does the proposed Land Use Activity area include designated Old Growth Forest and/or Old Growth Management Areas?',
                'header1':'NUMBER OF OGMA\'s',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT count(cr.the_geom) as number_of_ogma, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_lilwat_ogma as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Have there been any AIUS or other studies done in the proposed Land Use Activity area?',
                'header1':'(Not Implemented Yet)',
                'header2':'',
                'sql':''
            },{
                'title':'Does the proposed Land Use Activity area include any significant part of key water courses?',
                'header1':'(Not Implemented Yet)',
                'header2':'',
                'sql':''
            },{
                'title':'Are there any stands of young cedar within the proposed Land Use Activity area?',
                'header1':'(Not Implemented Yet)',
                'header2':'',
                'sql':''
            },{
                'title':'What is the proportion of the proposed Land Use Activity area compared with nearby commercial recreation tenures?',
                'header1':'(Not Implemented Yet)',
                'header2':'',
                'sql':''
            }
    ]],
    'haida_forestry_report':[[
            {
                'table':'bd_haida_topo_terrain',
                'title':'Topographic Terrain',
                'area_units':'sq. km'
            },{
                'table':'bd_haida_hydro_watersheds',
                'title':'Watersheds',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_dev_fsp',
                'title':'Forest Stewardship Plan Developments',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_wha',
                'title':'Wildlife Habitat Areas',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_rare_plants',
                'title':'Commercial Recreation Withdrawals',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_rare_old_ecosystems',
                'title':'Rare Old Forest Ecosystems',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_hvfh',
                'title':'Fish Habitat (High Value)',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_nhvfh',
                'title':'Fish Habitat (Not High Value)',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_bio_forested_swamps',
                'title':'Forested Swamps',
                'area_units':'sq. km'  
            },{
                'table':'bd_haida_lup_protected_areas',
                'title':'Protected Areas (Land Use Plan)',
                'area_units':'sq. km'  
            }
        ],[
            {
                'title':'What is the size of the proposed Land Use Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Land Use Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any watershed areas?',
                'header1':'WATERSHED NAME',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(twau_name) as watershed_name, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_hydro_watersheds as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.twau_name"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any protected areas?',
                'header1':'LUP NAME',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(name) as lup_name, 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_lup_protected_areas as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.name"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any fish habitat (high value) zones?',
                'header1':'FISH CLASS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(fish_class), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_bio_hvfh as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.fish_class"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any fish habitat (low value) zones?',
                'header1':'FISH CLASS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(fish_class), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_bio_nhvfh as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.fish_class"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any known rare old ecosystems?',
                'header1':'TYPE',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(eco_type), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_bio_rare_old_ecosystems as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.eco_type"""
            },{
                'title':'Are there known bear dens or day beds in the proposed Land Use Activity area?',
                'header1':'X-Coordinate',
                'header2':'Y-Coordinate',
                'sql':"""SELECT x, y 
                         FROM bd_haida_bio_black_bear as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any forested swamps?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(eco_type), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_bio_forested_swamps as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.eco_type"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with any Forest Stewardship Plan submissions or known operating areas?',
                'header1':'LOCATION',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(location), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_dev_fsp as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.location"""
            },{
                'title':'Does the proposed Land Use Activity area intersect with unstable terrain?',
                'header1':'STABILITY CLASS',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT trunc(terstbcl, 0), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_haida_topo_terrain as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str
                         AND terstbcl != 0.00000000000
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.terstbcl"""
            },{
                'title':'Are there known culturally modified trees in the proposed Land Use Activity area?',
                'header1':'',
                'header2':'COUNT',
                'sql':"""SELECT 'Culturally Modified Trees', count(*) 
                         FROM bd_haida_cmts as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Are there known monumental trees (from 2004) in the proposed Land Use Activity area?',
                'header1':'',
                'header2':'COUNT',
                'sql':"""SELECT 'Monumental Trees', count(*) 
                         FROM bd_haida_cult_monumentals04 as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Are there known monumental trees (from 2002/03) in the proposed Land Use Activity area?',
                'header1':'',
                'header2':'COUNT',
                'sql':"""SELECT 'Monumental Trees', count(*) 
                         FROM bd_haida_cult_monumentals0203 as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Are there known Monumental Cedar Inventory Trees in the proposed Land Use Activity area?',
                'header1':'',
                'header2':'COUNT',
                'sql':"""SELECT 'Monumental Cedar Inventory Trees', count(*) 
                         FROM bd_haida_cult_monumentals_cin as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Are there known rare plants in the proposed Land Use Activity area?',
                'header1':'COMMON NAME',
                'header2':'SPECIES',
                'sql':"""SELECT scomname, sname
                         FROM bd_haida_bio_rare_plants as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)""" 
            },{
                'title':'Are there known culturally significant plants in the proposed Land Use Activity area?',
                'header1':'ENGLISH NAME',
                'header2':'HAIDA NAME',
                'sql':"""SELECT species_en, species_ha
                         FROM bd_haida_cult_plants as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)""" 
            },{
                'title':'Is the area in or adjacent to a blue-listed plant community?',
                'header1':'(Data not available at the moment)',
                'header2':'',
                'sql':''
            }
        ]],
        'ona_forestry_report':[[
            {
                'table':'bd_ona_forest_tenure_cut_blocks',
                'title':'Forest Tenure Cut Blocks',
                'area_units':'sq. km'  
            },{
                'table':'bd_ona_forested_wetlands',
                'title':'Forested Wetlands',
                'area_units':'sq. km'  
            },{
                'table':'bd_ona_ground_water_aquifers',
                'title':'Ground Water Aquifers',
                'area_units':'sq. km'  
            },{
                'table':'bd_ona_archaeology_sites',
                'title':'Archaeology Sites',
                'area_units':'sq. km'  
            }
        ], [
            {
                'title':'What is the size of the proposed Land Use Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Land Use Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
                'title':'Is the Land Use Activity within a Ground Water Aquifer area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Ground Water Aquifer', 
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_ona_ground_water_aquifers as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Is the Land Use Activity within a Forested Wetland area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Forested Wetland', 
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_ona_forested_wetlands as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Is the Land Use Activity within a Forest Tenure Cut Block?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Forest Tenure Cut Bock', 
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_ona_forest_tenure_cut_blocks as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Is the Land Use Activity within a known Archaeology Site?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Archaeology Site', 
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_ona_archaeology_sites as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)"""
            },{
                'title':'Are there known Coyote Landmarks Areas within the proposed Land Use Activity area?',
                'header1':'NAME',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(cr.label), 
                              trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_ona_coyote_landmark_areas as cr, \
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom) 
                         GROUP BY cr.label"""
            }
        ]],
        'heiltsuk_report':[[
            {
                'table':'bd_heiltsuk_landuse_0806',
                'title':'Land Use Plan Designation',
                'area_units':'sq. km'
            },{
                'table':'bd_general_rmp_lu_svw',
                'title':'Provincial Landscape Units',
                'area_units':'sq. km'
            }
        ],[
            {
                'title':'What is the size of the proposed Land Use Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Land Use Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
                'title':'What Heiltsuk Land Use Plan Designations are within proposed Land Use Activity?',
                'header1':'LUP Designation',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(status),
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_heiltsuk_landuse_0806 as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.status"""
            },{
                'title':'In which Provincial Landscape Units does the proposed Land Use Activity fall?',
                'header1':'Landscape Unit Name',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(lu_name),
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_general_rmp_lu_svw as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.lu_name"""
            },{
                'title':'Does the proposed Land Use Activity  have any designated Grizzly Bear Habitat?',
                'header1':'Habitat Class',
                'header2':'Area (Ha)',
                'sql':"""SELECT distinct(class),
                                 trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM bd_heiltsuk_grizzly_schedule2_terr1kb as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.class"""
            }
        ]],
        'haida_marine_report':[[
            {
                'table':'haida_m_Coral_Sponge_PNCIMA',
                'title':'Coral Sponge PNCIMA Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Geoduck_00_05',
                'title':'Geoduck Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Oceanography_EBSA',
                'title':'Oceanography EBSA Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_RedUrchin_00_05',
                'title':'Red Urchin Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Sched2_96_04',
                'title':'Sched2 Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Shrimp_Trawl_96_04',
                'title':'Shrimp Trawl Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Crab_00_04',
                'title':'Crab Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_GroundTrawl_96_04',
                'title':'Ground Trawl Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Haida_Territory',
                'title':'Haida Territory',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Prawn_Trap_01_04',
                'title':'Prawn Trap Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Rockfish_Conservation_Area',
                'title':'Rockfish Conservation Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_ZN_Lic_93_04',
                'title':'ZN Lic Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Sable_LL_96_04',
                'title':'Sablefish Areas',
                'area_units':'sq. km'  
            },{
                'table':'haida_m_Sable_Trap_96_04',
                'title':'Sable Trap Areas',
                'area_units':'sq. km'  
            }
        ],[
            {
                'title':'What is the size of the proposed Marine Activity area?',
                'header1':'',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT 'Marine Activity Area', 
                                trunc(CAST ((sum(area(us.poly))/10000) AS numeric), 1) as intersect_area \
                         FROM referrals_referralshape as us 
                         WHERE where_id_str"""
            },{
                'title':'Does the proposed Marine Activity intersect with any Coral Sponge PNCIMA Areas?',
                'header1':'SPECIES',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(species), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM haida_m_Coral_Sponge_PNCIMA as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.species"""
            },{
                'title':'Does the proposed Marine Activity intersect with any Oceanography EBSA Areas?',
                'header1':'SPECIES',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(species), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM haida_m_Oceanography_EBSA as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.species"""
            },{
                'title':'Does the proposed Marine Activity intersect with any Rockfish Conservation Areas?',
                'header1':'NAME',
                'header2':'AREA IN HECTARES',
                'sql':"""SELECT distinct(name), 
                                trunc(CAST ((sum(area(intersection(us.poly,cr.the_geom)))/10000) AS numeric), 1) as intersect_area \
                         FROM haida_m_Rockfish_Conservation_Area as cr,
                              referrals_referralshape as us 
                         WHERE where_id_str 
                         AND intersects(us.poly,cr.the_geom)
                         GROUP BY cr.name"""
            }
        ]]}

from models import *

for k,v in ref_mgr.items():
    report = ReferralReport.objects.get(name=k)
    for l in v[1]:
        #r = ReferralReportLayer(**l)
        r = ReferralReportQuery(**l)
        r.report = report
        r.save()
        
        
