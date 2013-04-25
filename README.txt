LICENSE
=======
Terratruth
(Previously known as AMNDSS: Aboriginal Mapping Network Decision Support Tool)

The Terratruth decision support system supports Indigenous communities in their 
efforts to track and evaluate the impacts of proposed land use activities in their 
territories. This secure site has controlled access to prevent unauthorized viewing 
and use of sensitive local knowledge information.

Copyright (C) 2012 Ecotrust Canada
Knowledge Systems and Planning

This file is part of Terratruth code base.

Terratruth is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Terratruth is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Terratruth.  If not, see <http://www.gnu.org/licenses/>.

You may contact Ecotrust Canada via our website http://ecotrust.ca

INSTALLATION
============
Contact Lorin Gaertner, lorin@ecotrust.ca, for a document outlining installation instructions.

X) Install jsmin (or add it to the path of the application).

% sudo cp bin/jsmin /usr/bin/

Z) app data directories
% sudo mkdir -p /var/www/html/amndss/images/rectified/
% sudo mkdir -p /projects/amndss


RUNNING
=======

For performance and interoperability purposes, Terratruth uses fastcgi. There is a script in the root project directory to start the fcgi process:

./rundss

