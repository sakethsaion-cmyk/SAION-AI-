import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import SaionLogo from "../UI/SaionLogo";

// ─── Inline UI components ────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
        light ? "border-white" : "border-gray-800"
      }`}
    />
  );
}

// ─── Country + States/Regions Data ──────────────────────────────────────────

const COUNTRY_DATA: Record<string, { flag: string; timezone: string; regions: string[] }> = {
  "Afghanistan": { flag: "🇦🇫", timezone: "Asia/Kabul", regions: ["Kabul","Kandahar","Herat","Balkh","Nangarhar","Ghazni","Kunduz","Takhar","Badakhshan","Baghlan","Bamyan","Farah","Faryab","Ghor","Helmand","Jawzjan","Kapisa","Khost","Kunar","Laghman","Logar","Maidan Wardak","Nimroz","Nuristan","Paktia","Paktika","Panjshir","Parwan","Samangan","Sar-e-Pol","Uruzgan","Zabul"] },
  "Albania": { flag: "🇦🇱", timezone: "Europe/Tirane", regions: ["Berat","Dibër","Durrës","Elbasan","Fier","Gjirokastër","Korçë","Kukës","Lezhë","Shkodër","Tiranë","Vlorë"] },
  "Algeria": { flag: "🇩🇿", timezone: "Africa/Algiers", regions: ["Adrar","Aïn Defla","Aïn Témouchent","Algiers","Annaba","Batna","Béchar","Béjaïa","Biskra","Blida","Bordj Bou Arréridj","Bouira","Boumerdès","Chlef","Constantine","Djelfa","El Bayadh","El Oued","El Tarf","Ghardaïa","Guelma","Illizi","Jijel","Khenchela","Laghouat","M'Sila","Mascara","Médéa","Mila","Mostaganem","Naâma","Oran","Ouargla","Oum el Bouaghi","Relizane","Saïda","Sétif","Sidi Bel Abbès","Skikda","Souk Ahras","Tamanghasset","Tébessa","Tiaret","Tindouf","Tipaza","Tissemsilt","Tizi Ouzou","Tlemcen"] },
  "Andorra": { flag: "🇦🇩", timezone: "Europe/Andorra", regions: ["Andorra la Vella","Canillo","Encamp","Escaldes-Engordany","La Massana","Ordino","Sant Julià de Lòria"] },
  "Angola": { flag: "🇦🇴", timezone: "Africa/Luanda", regions: ["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"] },
  "Argentina": { flag: "🇦🇷", timezone: "America/Argentina/Buenos_Aires", regions: ["Buenos Aires","Catamarca","Chaco","Chubut","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"] },
  "Armenia": { flag: "🇦🇲", timezone: "Asia/Yerevan", regions: ["Aragatsotn","Ararat","Armavir","Gegharkunik","Kotayk","Lori","Shirak","Syunik","Tavush","Vayots Dzor","Yerevan"] },
  "Australia": { flag: "🇦🇺", timezone: "Australia/Sydney", regions: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"] },
  "Austria": { flag: "🇦🇹", timezone: "Europe/Vienna", regions: ["Burgenland","Carinthia","Lower Austria","Salzburg","Styria","Tyrol","Upper Austria","Vienna","Vorarlberg"] },
  "Azerbaijan": { flag: "🇦🇿", timezone: "Asia/Baku", regions: ["Absheron","Agdam","Agdash","Aghjabadi","Agstafa","Agsu","Astara","Baku","Balakan","Barda","Beylagan","Bilasuvar","Dashkasan","Fizuli","Gadabay","Ganja","Goranboy","Goychay","Goygol","Hajigabul","Imishli","Ismailli","Jabrayil","Jalilabad","Kalbajar","Khachmaz","Khizi","Kurdamir","Lachin","Lankaran","Lerik","Masally","Mingachevir","Nakhchivan","Neftchala","Oghuz","Qakh","Qazakh","Quba","Qubadli","Qusar","Saatly","Sabirabad","Salyan","Shamakhi","Shamkir","Sharur","Shirvan","Shusha","Siazan","Sumgayit","Tartar","Tovuz","Ujar","Yardymli","Yevlakh","Zangilan","Zaqatala","Zardab"] },
  "Bahrain": { flag: "🇧🇭", timezone: "Asia/Bahrain", regions: ["Capital","Central","Muharraq","Northern","Southern"] },
  "Bangladesh": { flag: "🇧🇩", timezone: "Asia/Dhaka", regions: ["Barisal","Chittagong","Dhaka","Khulna","Mymensingh","Rajshahi","Rangpur","Sylhet"] },
  "Belarus": { flag: "🇧🇾", timezone: "Europe/Minsk", regions: ["Brest","Gomel","Grodno","Minsk","Mogilev","Vitebsk"] },
  "Belgium": { flag: "🇧🇪", timezone: "Europe/Brussels", regions: ["Antwerp","Brussels","East Flanders","Flemish Brabant","Hainaut","Liège","Limburg","Luxembourg","Namur","Walloon Brabant","West Flanders"] },
  "Bolivia": { flag: "🇧🇴", timezone: "America/La_Paz", regions: ["Beni","Chuquisaca","Cochabamba","La Paz","Oruro","Pando","Potosí","Santa Cruz","Tarija"] },
  "Bosnia and Herzegovina": { flag: "🇧🇦", timezone: "Europe/Sarajevo", regions: ["Bosnian Podrinje Canton","Canton 10","Central Bosnia Canton","Herzegovina-Neretva Canton","Posavina Canton","Republika Srpska","Sarajevo Canton","Tuzla Canton","Una-Sana Canton","West Herzegovina Canton","Zenica-Doboj Canton"] },
  "Brazil": { flag: "🇧🇷", timezone: "America/Sao_Paulo", regions: ["Acre","Alagoas","Amapá","Amazonas","Bahia","Ceará","Distrito Federal","Espírito Santo","Goiás","Maranhão","Mato Grosso","Mato Grosso do Sul","Minas Gerais","Pará","Paraíba","Paraná","Pernambuco","Piauí","Rio de Janeiro","Rio Grande do Norte","Rio Grande do Sul","Rondônia","Roraima","Santa Catarina","São Paulo","Sergipe","Tocantins"] },
  "Bulgaria": { flag: "🇧🇬", timezone: "Europe/Sofia", regions: ["Blagoevgrad","Burgas","Dobrich","Gabrovo","Haskovo","Kardzhali","Kyustendil","Lovech","Montana","Pazardzhik","Pernik","Pleven","Plovdiv","Razgrad","Ruse","Shumen","Silistra","Sliven","Smolyan","Sofia","Sofia Province","Stara Zagora","Targovishte","Varna","Veliko Tarnovo","Vidin","Vratsa","Yambol"] },
  "Cambodia": { flag: "🇰🇭", timezone: "Asia/Phnom_Penh", regions: ["Banteay Meanchey","Battambang","Kampong Cham","Kampong Chhnang","Kampong Speu","Kampong Thom","Kampot","Kandal","Kep","Koh Kong","Kratié","Mondulkiri","Oddar Meanchey","Pailin","Phnom Penh","Preah Sihanouk","Preah Vihear","Prey Veng","Pursat","Ratanakiri","Siem Reap","Stung Treng","Svay Rieng","Takéo","Tboung Khmum"] },
  "Cameroon": { flag: "🇨🇲", timezone: "Africa/Douala", regions: ["Adamawa","Centre","East","Far North","Littoral","North","Northwest","South","Southwest","West"] },
  "Canada": { flag: "🇨🇦", timezone: "America/Toronto", regions: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"] },
  "Chile": { flag: "🇨🇱", timezone: "America/Santiago", regions: ["Antofagasta","Araucanía","Arica y Parinacota","Atacama","Aysén","Biobío","Coquimbo","Los Lagos","Los Ríos","Magallanes","Maule","Metropolitana","Ñuble","O'Higgins","Tarapacá","Valparaíso"] },
  "China": { flag: "🇨🇳", timezone: "Asia/Shanghai", regions: ["Anhui","Beijing","Chongqing","Fujian","Gansu","Guangdong","Guangxi","Guizhou","Hainan","Hebei","Heilongjiang","Henan","Hong Kong","Hubei","Hunan","Inner Mongolia","Jiangsu","Jiangxi","Jilin","Liaoning","Macau","Ningxia","Qinghai","Shaanxi","Shandong","Shanghai","Shanxi","Sichuan","Tianjin","Tibet","Xinjiang","Yunnan","Zhejiang"] },
  "Colombia": { flag: "🇨🇴", timezone: "America/Bogota", regions: ["Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada"] },
  "Congo (DRC)": { flag: "🇨🇩", timezone: "Africa/Kinshasa", regions: ["Bandundu","Bas-Congo","Équateur","Kasaï-Occidental","Kasaï-Oriental","Katanga","Kinshasa","Maniema","Nord-Kivu","Orientale","Sud-Kivu"] },
  "Costa Rica": { flag: "🇨🇷", timezone: "America/Costa_Rica", regions: ["Alajuela","Cartago","Guanacaste","Heredia","Limón","Puntarenas","San José"] },
  "Croatia": { flag: "🇭🇷", timezone: "Europe/Zagreb", regions: ["Bjelovar-Bilogora","Brod-Posavina","Dubrovnik-Neretva","Istria","Karlovac","Koprivnica-Križevci","Krapina-Zagorje","Lika-Senj","Međimurje","Osijek-Baranja","Požega-Slavonia","Primorje-Gorski Kotar","Šibenik-Knin","Sisak-Moslavina","Split-Dalmatia","Varaždin","Virovitica-Podravina","Vukovar-Syrmia","Zadar","Zagreb","Zagreb County"] },
  "Cuba": { flag: "🇨🇺", timezone: "America/Havana", regions: ["Artemisa","Camagüey","Ciego de Ávila","Cienfuegos","Granma","Guantánamo","Holguín","Isla de la Juventud","La Habana","Las Tunas","Matanzas","Mayabeque","Pinar del Río","Sancti Spíritus","Santiago de Cuba","Villa Clara"] },
  "Czech Republic": { flag: "🇨🇿", timezone: "Europe/Prague", regions: ["Central Bohemia","Hradec Králové","Karlovy Vary","Liberec","Moravia-Silesia","Olomouc","Pardubice","Plzeň","Prague","South Bohemia","South Moravia","Ústí nad Labem","Vysočina","Zlín"] },
  "Denmark": { flag: "🇩🇰", timezone: "Europe/Copenhagen", regions: ["Capital","Central Jutland","North Jutland","Zealand","Southern Denmark"] },
  "Dominican Republic": { flag: "🇩🇴", timezone: "America/Santo_Domingo", regions: ["Azua","Bahoruco","Barahona","Dajabón","Distrito Nacional","Duarte","El Seibo","Elías Piña","Espaillat","Hato Mayor","Hermanas Mirabal","Independencia","La Altagracia","La Romana","La Vega","María Trinidad Sánchez","Monseñor Nouel","Monte Cristi","Monte Plata","Pedernales","Peravia","Puerto Plata","Samaná","San Cristóbal","San José de Ocoa","San Juan","San Pedro de Macorís","Sánchez Ramírez","Santiago","Santiago Rodríguez","Santo Domingo","Valverde"] },
  "Ecuador": { flag: "🇪🇨", timezone: "America/Guayaquil", regions: ["Azuay","Bolívar","Cañar","Carchi","Chimborazo","Cotopaxi","El Oro","Esmeraldas","Galápagos","Guayas","Imbabura","Loja","Los Ríos","Manabí","Morona Santiago","Napo","Orellana","Pastaza","Pichincha","Santa Elena","Santo Domingo","Sucumbíos","Tungurahua","Zamora Chinchipe"] },
  "Egypt": { flag: "🇪🇬", timezone: "Africa/Cairo", regions: ["Alexandria","Aswan","Asyut","Beheira","Beni Suef","Cairo","Dakahlia","Damietta","Faiyum","Gharbia","Giza","Ismailia","Kafr el-Sheikh","Luxor","Matruh","Minya","Monufia","New Valley","North Sinai","Port Said","Qalyubia","Qena","Red Sea","Sharqia","Sohag","South Sinai","Suez"] },
  "Ethiopia": { flag: "🇪🇹", timezone: "Africa/Addis_Ababa", regions: ["Addis Ababa","Afar","Amhara","Benishangul-Gumuz","Dire Dawa","Gambela","Harari","Oromia","Sidama","Somali","Southern Nations","Tigray"] },
  "Finland": { flag: "🇫🇮", timezone: "Europe/Helsinki", regions: ["Central Finland","Central Ostrobothnia","Finland Proper","Kainuu","Kymenlaakso","Lapland","North Karelia","North Ostrobothnia","North Savo","Ostrobothnia","Päijänne Tavastia","Pirkanmaa","Satakunta","South Karelia","South Ostrobothnia","South Savo","Tavastia Proper","Uusimaa"] },
  "France": { flag: "🇫🇷", timezone: "Europe/Paris", regions: ["Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Bretagne","Centre-Val de Loire","Corse","Grand Est","Guadeloupe","Guyane","Hauts-de-France","Île-de-France","La Réunion","Martinique","Mayotte","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur"] },
  "Germany": { flag: "🇩🇪", timezone: "Europe/Berlin", regions: ["Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse","Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate","Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia"] },
  "Ghana": { flag: "🇬🇭", timezone: "Africa/Accra", regions: ["Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East","Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"] },
  "Greece": { flag: "🇬🇷", timezone: "Europe/Athens", regions: ["Attica","Central Greece","Central Macedonia","Crete","Eastern Macedonia and Thrace","Epirus","Ionian Islands","North Aegean","Peloponnese","South Aegean","Thessaly","Western Greece","Western Macedonia"] },
  "Guatemala": { flag: "🇬🇹", timezone: "America/Guatemala", regions: ["Alta Verapaz","Baja Verapaz","Chimaltenango","Chiquimula","El Progreso","Escuintla","Guatemala","Huehuetenango","Izabal","Jalapa","Jutiapa","Petén","Quetzaltenango","Quiché","Retalhuleu","Sacatepéquez","San Marcos","Santa Rosa","Sololá","Suchitepéquez","Totonicapán","Zacapa"] },
  "Honduras": { flag: "🇭🇳", timezone: "America/Tegucigalpa", regions: ["Atlántida","Choluteca","Colón","Comayagua","Copán","Cortés","El Paraíso","Francisco Morazán","Gracias a Dios","Intibucá","Islas de la Bahía","La Paz","Lempira","Ocotepeque","Olancho","Santa Bárbara","Valle","Yoro"] },
  "Hungary": { flag: "🇭🇺", timezone: "Europe/Budapest", regions: ["Bács-Kiskun","Baranya","Békés","Borsod-Abaúj-Zemplén","Budapest","Csongrád-Csanád","Fejér","Győr-Moson-Sopron","Hajdú-Bihar","Heves","Jász-Nagykun-Szolnok","Komárom-Esztergom","Nógrád","Pest","Somogy","Szabolcs-Szatmár-Bereg","Tolna","Vas","Veszprém","Zala"] },
  "India": { flag: "🇮🇳", timezone: "Asia/Kolkata", regions: ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"] },
  "Indonesia": { flag: "🇮🇩", timezone: "Asia/Jakarta", regions: ["Aceh","Bali","Bangka Belitung","Banten","Bengkulu","Central Java","Central Kalimantan","Central Sulawesi","East Java","East Kalimantan","East Nusa Tenggara","Gorontalo","Jakarta","Jambi","Lampung","Maluku","North Kalimantan","North Maluku","North Sulawesi","North Sumatra","Papua","Riau","Riau Islands","South Kalimantan","South Sulawesi","South Sumatra","Southeast Sulawesi","West Java","West Kalimantan","West Nusa Tenggara","West Papua","West Sulawesi","West Sumatra","Yogyakarta"] },
  "Iran": { flag: "🇮🇷", timezone: "Asia/Tehran", regions: ["Alborz","Ardabil","Bushehr","Chaharmahal and Bakhtiari","East Azerbaijan","Fars","Gilan","Golestan","Hamadan","Hormozgan","Ilam","Isfahan","Kerman","Kermanshah","Khuzestan","Kohgiluyeh and Boyer-Ahmad","Kurdistan","Lorestan","Markazi","Mazandaran","North Khorasan","Qazvin","Qom","Razavi Khorasan","Semnan","Sistan and Baluchestan","South Khorasan","Tehran","West Azerbaijan","Yazd","Zanjan"] },
  "Iraq": { flag: "🇮🇶", timezone: "Asia/Baghdad", regions: ["Al Anbar","Al Muthanna","Al-Qādisiyyah","An Najaf","Babil","Baghdad","Basra","Dhi Qar","Diyala","Dohuk","Erbil","Halabja","Karbala","Kirkuk","Maysan","Nineveh","Saladin","Sulaymaniyah","Wasit"] },
  "Ireland": { flag: "🇮🇪", timezone: "Europe/Dublin", regions: ["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"] },
  "Israel": { flag: "🇮🇱", timezone: "Asia/Jerusalem", regions: ["Central","Haifa","Jerusalem","Northern","Southern","Tel Aviv"] },
  "Italy": { flag: "🇮🇹", timezone: "Europe/Rome", regions: ["Abruzzo","Aosta Valley","Apulia","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardy","Marche","Molise","Piedmont","Sardinia","Sicily","Trentino-Alto Adige","Tuscany","Umbria","Veneto"] },
  "Jamaica": { flag: "🇯🇲", timezone: "America/Jamaica", regions: ["Clarendon","Hanover","Kingston","Manchester","Portland","Saint Andrew","Saint Ann","Saint Catherine","Saint Elizabeth","Saint James","Saint Mary","Saint Thomas","Trelawny","Westmoreland"] },
  "Japan": { flag: "🇯🇵", timezone: "Asia/Tokyo", regions: ["Aichi","Akita","Aomori","Chiba","Ehime","Fukui","Fukuoka","Fukushima","Gifu","Gunma","Hiroshima","Hokkaido","Hyogo","Ibaraki","Ishikawa","Iwate","Kagawa","Kagoshima","Kanagawa","Kochi","Kumamoto","Kyoto","Mie","Miyagi","Miyazaki","Nagano","Nagasaki","Nara","Niigata","Oita","Okayama","Okinawa","Osaka","Saga","Saitama","Shiga","Shimane","Shizuoka","Tochigi","Tokushima","Tokyo","Tottori","Toyama","Wakayama","Yamagata","Yamaguchi","Yamanashi"] },
  "Jordan": { flag: "🇯🇴", timezone: "Asia/Amman", regions: ["Ajloun","Aqaba","Balqa","Irbid","Jarash","Karak","Ma'an","Madaba","Mafraq","Petra","Tafilah","Zarqa"] },
  "Kazakhstan": { flag: "🇰🇿", timezone: "Asia/Almaty", regions: ["Akmola","Aktobe","Almaty","Almaty City","Atyrau","East Kazakhstan","Jambyl","Karaganda","Kostanay","Kyzylorda","Mangystau","North Kazakhstan","Nur-Sultan","Pavlodar","Turkestan","West Kazakhstan"] },
  "Kenya": { flag: "🇰🇪", timezone: "Africa/Nairobi", regions: ["Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans-Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"] },
  "Kuwait": { flag: "🇰🇼", timezone: "Asia/Kuwait", regions: ["Al Ahmadi","Al Asimah","Al Farwaniyah","Al Jahra","Hawalli","Mubarak Al-Kabeer"] },
  "Kyrgyzstan": { flag: "🇰🇬", timezone: "Asia/Bishkek", regions: ["Batken","Bishkek","Chuy","Issyk-Kul","Jalal-Abad","Naryn","Osh","Talas"] },
  "Lebanon": { flag: "🇱🇧", timezone: "Asia/Beirut", regions: ["Akkar","Baalbek-Hermel","Beirut","Beqaa","Mount Lebanon","Nabatieh","North","South"] },
  "Libya": { flag: "🇱🇾", timezone: "Africa/Tripoli", regions: ["Al Butnan","Al Jabal al Akhdar","Al Jabal al Gharbi","Al Jafara","Al Jufra","Al Kufra","Al Marj","Al Marqab","Al Wahat","An Nuqat al Khams","Az Zawiya","Benghazi","Derna","Ghat","Misrata","Murzuq","Nalut","Sabha","Surt","Tripoli","Wadi al Hayaa","Wadi al Shatii","Zuwarah"] },
  "Malaysia": { flag: "🇲🇾", timezone: "Asia/Kuala_Lumpur", regions: ["Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Melaka","Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya","Sabah","Sarawak","Selangor","Terengganu"] },
  "Mexico": { flag: "🇲🇽", timezone: "America/Mexico_City", regions: ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"] },
  "Morocco": { flag: "🇲🇦", timezone: "Africa/Casablanca", regions: ["Béni Mellal-Khénifra","Casablanca-Settat","Drâa-Tafilalet","Fès-Meknès","Guelmim-Oued Noun","Laâyoune-Sakia El Hamra","Marrakesh-Safi","Oriental","Rabat-Salé-Kénitra","Souss-Massa","Tanger-Tétouan-Al Hoceïma"] },
  "Myanmar": { flag: "🇲🇲", timezone: "Asia/Rangoon", regions: ["Ayeyarwady","Bago","Chin","Kachin","Kayah","Kayin","Magway","Mandalay","Mon","Naypyidaw","Rakhine","Sagaing","Shan","Tanintharyi","Yangon"] },
  "Nepal": { flag: "🇳🇵", timezone: "Asia/Kathmandu", regions: ["Bagmati","Gandaki","Karnali","Koshi","Lumbini","Madhesh","Sudurpashchim"] },
  "Netherlands": { flag: "🇳🇱", timezone: "Europe/Amsterdam", regions: ["Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg","North Brabant","North Holland","Overijssel","South Holland","Utrecht","Zeeland"] },
  "New Zealand": { flag: "🇳🇿", timezone: "Pacific/Auckland", regions: ["Auckland","Bay of Plenty","Canterbury","Gisborne","Hawke's Bay","Manawatu-Whanganui","Marlborough","Nelson","Northland","Otago","Southland","Taranaki","Tasman","Waikato","Wellington","West Coast"] },
  "Nigeria": { flag: "🇳🇬", timezone: "Africa/Lagos", regions: ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"] },
  "North Korea": { flag: "🇰🇵", timezone: "Asia/Pyongyang", regions: ["Chagang","Hamgyong North","Hamgyong South","Hwanghae North","Hwanghae South","Kangwon","North Pyongan","Pyongyang","Rason","Ryanggang","South Pyongan","South Pyongan"] },
  "Norway": { flag: "🇳🇴", timezone: "Europe/Oslo", regions: ["Agder","Innlandet","Møre og Romsdal","Nordland","Oslo","Rogaland","Svalbard","Troms og Finnmark","Trøndelag","Vestfold og Telemark","Vestland","Viken"] },
  "Pakistan": { flag: "🇵🇰", timezone: "Asia/Karachi", regions: ["Azad Kashmir","Balochistan","Gilgit-Baltistan","Islamabad Capital Territory","Khyber Pakhtunkhwa","Punjab","Sindh"] },
  "Palestine": { flag: "🇵🇸", timezone: "Asia/Gaza", regions: ["Gaza Strip","West Bank"] },
  "Panama": { flag: "🇵🇦", timezone: "America/Panama", regions: ["Bocas del Toro","Chiriquí","Coclé","Colón","Darién","Emberá","Guna Yala","Herrera","Los Santos","Ngäbe-Buglé","Panamá","Panamá Oeste","Veraguas"] },
  "Paraguay": { flag: "🇵🇾", timezone: "America/Asuncion", regions: ["Alto Paraguay","Alto Paraná","Amambay","Asunción","Boquerón","Caaguazú","Caazapá","Canindeyú","Central","Concepción","Cordillera","Guairá","Itapúa","Misiones","Ñeembucú","Paraguarí","Presidente Hayes","San Pedro"] },
  "Peru": { flag: "🇵🇪", timezone: "America/Lima", regions: ["Amazonas","Ancash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali"] },
  "Philippines": { flag: "🇵🇭", timezone: "Asia/Manila", regions: ["Bicol","Cagayan Valley","Calabarzon","Caraga","Cordillera Administrative Region","Davao","Eastern Visayas","Ilocos","Metro Manila","Mimaropa","Northern Mindanao","Soccsksargen","Western Visayas","Zamboanga Peninsula"] },
  "Poland": { flag: "🇵🇱", timezone: "Europe/Warsaw", regions: ["Greater Poland","Kuyavian-Pomeranian","Lesser Poland","Łódź","Lower Silesian","Lublin","Lubusz","Masovian","Opole","Podlaskie","Pomeranian","Silesian","Subcarpathian","Świętokrzyskie","Warmian-Masurian","West Pomeranian"] },
  "Portugal": { flag: "🇵🇹", timezone: "Europe/Lisbon", regions: ["Aveiro","Azores","Beja","Braga","Bragança","Castelo Branco","Coimbra","Évora","Faro","Guarda","Leiria","Lisbon","Madeira","Portalegre","Porto","Santarém","Setúbal","Viana do Castelo","Vila Real","Viseu"] },
  "Qatar": { flag: "🇶🇦", timezone: "Asia/Qatar", regions: ["Ad Dawhah","Al Khor","Al Rayyan","Al Shamal","Al Wakrah","Ash Shahaniyah","Madinat ash Shamal","Umm Salal"] },
  "Romania": { flag: "🇷🇴", timezone: "Europe/Bucharest", regions: ["Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brăila","Brașov","Bucharest","Buzău","Călărași","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt","Prahova","Sălaj","Satu Mare","Sibiu","Suceava","Teleorman","Timiș","Tulcea","Vâlcea","Vaslui","Vrancea"] },
  "Russia": { flag: "🇷🇺", timezone: "Europe/Moscow", regions: ["Altai Krai","Altai Republic","Amur Oblast","Arkhangelsk Oblast","Astrakhan Oblast","Belgorod Oblast","Bryansk Oblast","Buryatia","Chechen Republic","Chelyabinsk Oblast","Chukotka","Chuvashia","Dagestan","Ingushetia","Irkutsk Oblast","Ivanovo Oblast","Jewish Autonomous Oblast","Kabardino-Balkaria","Kaliningrad Oblast","Kalmykia","Kaluga Oblast","Kamchatka Krai","Karachay-Cherkessia","Karelia","Kemerovo Oblast","Khabarovsk Krai","Khakassia","Khanty-Mansiysk","Kirov Oblast","Komi","Kostroma Oblast","Krasnodar Krai","Krasnoyarsk Krai","Kurgan Oblast","Kursk Oblast","Leningrad Oblast","Lipetsk Oblast","Magadan Oblast","Mari El","Mordovia","Moscow","Moscow Oblast","Murmansk Oblast","Nenets","Nizhny Novgorod Oblast","North Ossetia","Novgorod Oblast","Novosibirsk Oblast","Omsk Oblast","Orenburg Oblast","Oryol Oblast","Penza Oblast","Perm Krai","Primorsky Krai","Pskov Oblast","Rostov Oblast","Ryazan Oblast","Saint Petersburg","Sakha","Sakhalin Oblast","Samara Oblast","Saratov Oblast","Smolensk Oblast","Stavropol Krai","Sverdlovsk Oblast","Tambov Oblast","Tatarstan","Tomsk Oblast","Tula Oblast","Tuva","Tver Oblast","Tyumen Oblast","Udmurtia","Ulyanovsk Oblast","Vladimir Oblast","Volgograd Oblast","Vologda Oblast","Voronezh Oblast","Yamalo-Nenets","Yaroslavl Oblast","Zabaykalsky Krai"] },
  "Saudi Arabia": { flag: "🇸🇦", timezone: "Asia/Riyadh", regions: ["Al Bahah","Al Jawf","Al Madinah","Al Qassim","Asir","Eastern Province","Ha'il","Jazan","Mecca","Najran","Northern Borders","Riyadh","Tabuk"] },
  "Senegal": { flag: "🇸🇳", timezone: "Africa/Dakar", regions: ["Dakar","Diourbel","Fatick","Kaffrine","Kaolack","Kédougou","Kolda","Louga","Matam","Saint-Louis","Sédhiou","Tambacounda","Thiès","Ziguinchor"] },
  "Serbia": { flag: "🇷🇸", timezone: "Europe/Belgrade", regions: ["Belgrade","Bor","Braničevo","Jablanica","Kolubara","Mačva","Moravica","Nišava","Pčinja","Pirot","Podunavlje","Pomoravlje","Rasina","Raška","South Banat","South Bačka","Srem","Šumadija","Toplica","Vojvodina","Zaječar","Zlatibor"] },
  "Singapore": { flag: "🇸🇬", timezone: "Asia/Singapore", regions: ["Central Region","East Region","North Region","North-East Region","West Region"] },
  "South Africa": { flag: "🇿🇦", timezone: "Africa/Johannesburg", regions: ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"] },
  "South Korea": { flag: "🇰🇷", timezone: "Asia/Seoul", regions: ["Busan","Chungcheongbuk-do","Chungcheongnam-do","Daegu","Daejeon","Gangwon-do","Gwangju","Gyeonggi-do","Gyeongsangbuk-do","Gyeongsangnam-do","Incheon","Jeju","Jeollabuk-do","Jeollanam-do","Sejong","Seoul","Ulsan"] },
  "Spain": { flag: "🇪🇸", timezone: "Europe/Madrid", regions: ["Andalusia","Aragon","Asturias","Balearic Islands","Basque Country","Canary Islands","Cantabria","Castilla-La Mancha","Castile and León","Catalonia","Ceuta","Extremadura","Galicia","La Rioja","Madrid","Melilla","Murcia","Navarre","Valencia"] },
  "Sri Lanka": { flag: "🇱🇰", timezone: "Asia/Colombo", regions: ["Central","Eastern","North Central","North Western","Northern","Sabaragamuwa","Southern","Uva","Western"] },
  "Sudan": { flag: "🇸🇩", timezone: "Africa/Khartoum", regions: ["Al Jazirah","Al Qadarif","Blue Nile","Central Darfur","East Darfur","Kassala","Khartoum","North Darfur","North Kordofan","Northern","Red Sea","River Nile","Sennar","South Darfur","South Kordofan","West Darfur","West Kordofan","White Nile"] },
  "Sweden": { flag: "🇸🇪", timezone: "Europe/Stockholm", regions: ["Blekinge","Dalarna","Gävleborg","Gotland","Halland","Jämtland","Jönköping","Kalmar","Kronoberg","Norrbotten","Örebro","Östergötland","Skåne","Södermanland","Stockholm","Uppsala","Värmland","Västerbotten","Västernorrland","Västmanland","Västra Götaland"] },
  "Switzerland": { flag: "🇨🇭", timezone: "Europe/Zurich", regions: ["Aargau","Appenzell Ausserrhoden","Appenzell Innerrhoden","Basel-Landschaft","Basel-Stadt","Bern","Fribourg","Geneva","Glarus","Graubünden","Jura","Lucerne","Nidwalden","Obwalden","Schaffhausen","Schwyz","Solothurn","St. Gallen","Thurgau","Ticino","Uri","Valais","Vaud","Zug","Zürich"] },
  "Syria": { flag: "🇸🇾", timezone: "Asia/Damascus", regions: ["Al-Hasakah","Al-Qunaytirah","Aleppo","Ar-Raqqah","As-Suwayda","Damascus","Daraa","Deir ez-Zor","Hama","Homs","Idlib","Latakia","Quneitra","Rif Dimashq","Tartus"] },
  "Taiwan": { flag: "🇹🇼", timezone: "Asia/Taipei", regions: ["Changhua","Chiayi City","Chiayi County","Hsinchu City","Hsinchu County","Hualien","Kaohsiung","Keelung","Kinmen","Lienchiang","Miaoli","Nantou","New Taipei","Penghu","Pingtung","Taichung","Tainan","Taipei","Taitung","Taoyuan","Yilan","Yunlin"] },
  "Tajikistan": { flag: "🇹🇯", timezone: "Asia/Dushanbe", regions: ["Dushanbe","Gorno-Badakhshan","Khatlon","Sughd"] },
  "Tanzania": { flag: "🇹🇿", timezone: "Africa/Dar_es_Salaam", regions: ["Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma","Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza","Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga","Simiyu","Singida","Songwe","Tabora","Tanga","Zanzibar North","Zanzibar South","Zanzibar West"] },
  "Thailand": { flag: "🇹🇭", timezone: "Asia/Bangkok", regions: ["Amnat Charoen","Ang Thong","Bangkok","Bueng Kan","Buriram","Chachoengsao","Chai Nat","Chaiyaphum","Chanthaburi","Chiang Mai","Chiang Rai","Chon Buri","Chumphon","Kalasin","Kamphaeng Phet","Kanchanaburi","Khon Kaen","Krabi","Lampang","Lamphun","Loei","Lopburi","Mae Hong Son","Maha Sarakham","Mukdahan","Nakhon Nayok","Nakhon Pathom","Nakhon Phanom","Nakhon Ratchasima","Nakhon Sawan","Nakhon Si Thammarat","Nan","Narathiwat","Nong Bua Lamphu","Nong Khai","Nonthaburi","Pathum Thani","Pattani","Phang Nga","Phatthalung","Phayao","Phetchabun","Phetchaburi","Phichit","Phitsanulok","Phra Nakhon Si Ayutthaya","Phrae","Phuket","Prachin Buri","Prachuap Khiri Khan","Ranong","Ratchaburi","Rayong","Roi Et","Sa Kaeo","Sakon Nakhon","Samut Prakan","Samut Sakhon","Samut Songkhram","Saraburi","Satun","Sing Buri","Sisaket","Songkhla","Sukhothai","Suphan Buri","Surat Thani","Surin","Tak","Trang","Trat","Ubon Ratchathani","Udon Thani","Uthai Thani","Uttaradit","Yala","Yasothon"] },
  "Tunisia": { flag: "🇹🇳", timezone: "Africa/Tunis", regions: ["Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba","Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine","Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine","Tozeur","Tunis","Zaghouan"] },
  "Turkey": { flag: "🇹🇷", timezone: "Europe/Istanbul", regions: ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elâzığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","Istanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"] },
  "Uganda": { flag: "🇺🇬", timezone: "Africa/Kampala", regions: ["Central","Eastern","Northern","Western"] },
  "Ukraine": { flag: "🇺🇦", timezone: "Europe/Kiev", regions: ["Cherkasy","Chernihiv","Chernivtsi","Crimea","Dnipropetrovsk","Donetsk","Ivano-Frankivsk","Kharkiv","Kherson","Khmelnytskyi","Kirovohrad","Kyiv","Kyiv City","Luhansk","Lviv","Mykolaiv","Odessa","Poltava","Rivne","Sumy","Ternopil","Vinnytsia","Volyn","Zakarpattia","Zaporizhzhia","Zhytomyr"] },
  "United Arab Emirates": { flag: "🇦🇪", timezone: "Asia/Dubai", regions: ["Abu Dhabi","Ajman","Dubai","Fujairah","Ras Al Khaimah","Sharjah","Umm Al Quwain"] },
  "United Kingdom": { flag: "🇬🇧", timezone: "Europe/London", regions: ["England - East Midlands","England - East of England","England - London","England - North East","England - North West","England - South East","England - South West","England - West Midlands","England - Yorkshire and the Humber","Northern Ireland","Scotland","Wales"] },
  "United States": { flag: "🇺🇸", timezone: "America/New_York", regions: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","Washington D.C.","West Virginia","Wisconsin","Wyoming"] },
  "Uruguay": { flag: "🇺🇾", timezone: "America/Montevideo", regions: ["Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"] },
  "Uzbekistan": { flag: "🇺🇿", timezone: "Asia/Tashkent", regions: ["Andijan","Bukhara","Fergana","Jizzakh","Karakalpakstan","Kashkadarya","Khorezm","Namangan","Navoiy","Samarkand","Sirdaryo","Surxondaryo","Tashkent"] },
  "Venezuela": { flag: "🇻🇪", timezone: "America/Caracas", regions: ["Amazonas","Anzoátegui","Apure","Aragua","Barinas","Bolívar","Carabobo","Cojedes","Delta Amacuro","Distrito Capital","Falcón","Guárico","La Guaira","Lara","Mérida","Miranda","Monagas","Nueva Esparta","Portuguesa","Sucre","Táchira","Trujillo","Yaracuy","Zulia"] },
  "Vietnam": { flag: "🇻🇳", timezone: "Asia/Ho_Chi_Minh", regions: ["An Giang","Bà Rịa–Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu","Bắc Ninh","Bến Tre","Bình Định","Bình Dương","Bình Phước","Bình Thuận","Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên","Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh","Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hồ Chí Minh City","Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ","Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa","Thừa Thiên Huế","Tiền Giang","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái"] },
  "Yemen": { flag: "🇾🇪", timezone: "Asia/Aden", regions: ["Abyan","Aden","Al Bayda","Al Hudaydah","Al Jawf","Al Mahrah","Al Mahwit","Amran","Dhamar","Hadramawt","Hajjah","Ibb","Lahij","Ma'rib","Raymah","Sadah","Sana'a","Shabwah","Socotra","Taizz"] },
  "Zambia": { flag: "🇿🇲", timezone: "Africa/Lusaka", regions: ["Central","Copperbelt","Eastern","Luapula","Lusaka","Muchinga","North-Western","Northern","Southern","Western"] },
  "Zimbabwe": { flag: "🇿🇼", timezone: "Africa/Harare", regions: ["Bulawayo","Harare","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"] },
};

const SORTED_COUNTRIES = Object.keys(COUNTRY_DATA).sort();

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationInfo {
  timezone: string;
  city: string;
  country: string;
  flag: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"google" | "github" | null>(null);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("saion_location");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocation(parsed);
        setLocationConfirmed(true);
      } catch {}
    }
  }, []);

  const countryInfo = selectedCountry ? COUNTRY_DATA[selectedCountry] : null;
  const regions = countryInfo?.regions ?? [];

  const handleConfirmLocation = () => {
    if (!selectedCountry || !selectedRegion) return;
    const info: LocationInfo = {
      timezone: countryInfo!.timezone,
      city: selectedRegion,
      country: selectedCountry,
      flag: countryInfo!.flag,
    };
    setLocation(info);
    setLocationConfirmed(true);
    localStorage.setItem("saion_timezone", info.timezone);
    localStorage.setItem("saion_location", JSON.stringify(info));
  };

  const handleChangeLocation = () => {
    setLocationConfirmed(false);
    setSelectedCountry(location?.country ?? "");
    setSelectedRegion(location?.city ?? "");
  };

  const handleSignIn = async (
    fn: () => Promise<void>,
    provider: "google" | "github",
  ) => {
    if (!locationConfirmed) {
      setError("Please select your location before signing in.");
      return;
    }
    setError("");
    setLoading(provider);
    try {
      await fn();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-y-auto">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.5) 1px,transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md animate-fade-in py-8">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 mb-4 shadow-[0_0_40px_rgba(124,58,237,0.5)]">
            <SaionLogo size={52} animated />
          </div>
          <h1 className="font-display text-4xl font-bold text-white">
            SAION <span className="text-violet-400">AI</span>
          </h1>
          <p className="text-gray-500 mt-1.5 text-xs tracking-widest uppercase">
            by Saion Production
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-7 shadow-2xl space-y-4">
          <div>
            <h2 className="text-white font-display text-lg font-semibold mb-0.5">
              Welcome
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to your private AI workspace
            </p>
          </div>

          {/* Location box */}
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[#151515]">
              <span>📍</span>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                Location & Timezone
              </p>
              {locationConfirmed && (
                <button
                  onClick={handleChangeLocation}
                  className="ml-auto text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            <div className="px-3.5 py-3">
              {locationConfirmed && location ? (
                /* ── Confirmed state ── */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{location.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {location.city}, {location.country}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {location.timezone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-600">Limit resets</p>
                    <p className="text-[10px] text-violet-400">
                      at local midnight
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Selector state ── */
                <div className="space-y-2.5">
                  {/* Country */}
                  <div>
                    <label className="text-[10px] text-gray-600 uppercase tracking-wider mb-1 block">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCountry}
                        onChange={(e) => {
                          setSelectedCountry(e.target.value);
                          setSelectedRegion("");
                        }}
                        className="w-full bg-[#111] border border-[#222] text-white text-sm rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-violet-600 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select country…</option>
                        {SORTED_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {COUNTRY_DATA[c].flag} {c}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
                    </div>
                  </div>

                  {/* State / Region */}
                  <div>
                    <label className="text-[10px] text-gray-600 uppercase tracking-wider mb-1 block">
                      State / Region
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        disabled={!selectedCountry}
                        className="w-full bg-[#111] border border-[#222] text-white text-sm rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-violet-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>
                          {selectedCountry ? "Select state / region…" : "Select country first"}
                        </option>
                        {regions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirmLocation}
                    disabled={!selectedCountry || !selectedRegion}
                    className="w-full py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                  >
                    Confirm Location
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Sign in buttons */}
          <div className="space-y-3 pt-1">
            <button
              onClick={() => handleSignIn(signInWithGoogle, "google")}
              disabled={!!loading || !locationConfirmed}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "google" ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              onClick={() => handleSignIn(signInWithGithub, "github")}
              disabled={!!loading || !locationConfirmed}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#161b22] hover:bg-[#1c2128] text-white border border-[#30363d] rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "github" ? <Spinner light /> : <GitHubIcon />}
              Continue with GitHub
            </button>
          </div>

          {!locationConfirmed && (
            <p className="text-center text-gray-600 text-xs">
              Select your location above to enable sign in
            </p>
          )}

          <p className="text-center text-gray-700 text-xs">
            Your chats are private and encrypted per account.
          </p>
        </div>
        <p className="text-center text-gray-700 text-xs mt-4">
          © 2005–2026 Saion Production · All rights reserved
        </p>
      </div>
    </div>
  );
}