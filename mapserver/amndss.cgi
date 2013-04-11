#!/bin/sh

TARGET=$0

MAPSERVER_HOME=/usr/lib/cgi-bin/private

MAPFILE="/usr/local/apps/terratruth/mapserver/private_map_files/amndss-private.map"
if [ "${REQUEST_METHOD}" = "GET" ]; then
  if [ -z "${QUERY_STRING}" ]; then
    QUERY_STRING="map=${MAPFILE}"
  else
    QUERY_STRING="map=${MAPFILE}&password=whatever&${QUERY_STRING}"
  fi
fi

$MAPSERVER_HOME/mapserv "$@"
