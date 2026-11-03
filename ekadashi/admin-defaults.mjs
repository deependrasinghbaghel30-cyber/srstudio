export const REGIONS = ["North", "West", "South", "East", "Central", "Northeast"];

export const STATES = [
 {key:"uttar-pradesh",  name:"Uttar Pradesh",  region:"North",     weaves:["Banarasi","Chikankari","Zardozi"], motif:"buti",     base:"#7A1020", accent:"#D9A441", border:"#4A0A14", note:"Varanasi weaves real zari into silk for the Banarasi bride. Lucknow adds Chikankari, delicate white-on-white hand embroidery, and Zardozi brings heavy metallic-thread work for weddings."},
 {key:"punjab",         name:"Punjab",         region:"North",     weaves:["Phulkari"],                                     motif:"phulkari", base:"#8A1538", accent:"#F2A541", border:"#5C0E25", note:"Phulkari means 'flower work' — bright silk-floss darning stitches, worked from the back of the fabric into bold geometric blooms."},
 {key:"jammu-kashmir",  name:"Jammu & Kashmir",region:"North",     weaves:["Kashmiri Tilla","Sozni Embroidery","Kani Silk"],motif:"kani",     base:"#1F2A44", accent:"#C9A227", border:"#121A2C", note:"Kashmir's sarees carry the valley's paisley and chinar motifs — Tilla in metallic thread, Sozni in fine needlework."},
 {key:"rajasthan",      name:"Rajasthan",      region:"West",      weaves:["Kota Doria","Bandhani","Leheriya","Bagru Print","Anwa","Sanganeri"],             motif:"dots",     base:"#C2185B", accent:"#FFF3D6", border:"#F2A007", note:"Tie-and-dye country: tiny hand-tied dots make a Bandhani, wave-dyed stripes a Leheriya. Kota Doria is an airy square-check weave, Bagru and Sanganer are famous for hand-block prints, and Anwa for its handloom sarees."},
 {key:"gujarat",        name:"Gujarat",        region:"West",      weaves:["Patan Patola","Rajkot Patola","Single Ikat","Tangaliya","Ashavali","Bhujodi","Gharchola","Panetar","Gajji Silk","Soof Embroidery","Jamnagar Bandhani"],                motif:"ikat",     base:"#9E1B1B", accent:"#F2C14E", border:"#1D3557", note:"The Patan Patola is double ikat, the same on both sides; Rajkot weaves single ikat Patola. Tangaliya, Ashavali brocade and Bhujodi are handloom treasures, Gharchola and Panetar are wedding sarees, and Kutch adds Gajji silk and Soof embroidery."},
 {key:"maharashtra",    name:"Maharashtra",    region:"West",      weaves:["Paithani","Karvati Kinar","Solapuri Cotton","Himroo","Shalu"],                    motif:"paithani", base:"#5B1A6E", accent:"#E0B040", border:"#1F7A4A", note:"Paithani silk with its peacock pallu is a Maharashtrian bride's heirloom, and the Shalu is the bridal silk itself. Karvati Kinar has a saw-tooth temple border, Solapur weaves sturdy cottons, and Aurangabad's Himroo is a soft silk-cotton brocade."},
 {key:"goa",            name:"Goa",            region:"West",      weaves:["Kunbi"],                                        motif:"checks",   base:"#B22222", accent:"#F5E6C8", border:"#7A1414", note:"The Kunbi is Goa's oldest weave — a red-and-white checked cotton worn by the Kunbi and Gawda communities, now revived by local weavers."},
 {key:"madhya-pradesh", name:"Madhya Pradesh", region:"Central",   weaves:["Maheshwari","Chanderi","Bagh Print","Batik Print"],                        motif:"sheer",    base:"#E6D3B3", accent:"#B8892B", border:"#7B2D26", note:"Chanderi is sheer and glassy with tiny gold butis; Maheshwari has a reversible border. Bagh's hand-block prints use natural dyes in red and black, and Bherugarh near Ujjain is known for batik."},
 {key:"chhattisgarh",   name:"Chhattisgarh",   region:"Central",   weaves:["Kosa Silk"],                                    motif:"tussar",   base:"#C08A4A", accent:"#7A1F2B", border:"#5A3A1E", note:"Kosa is a wild silk from Champa and Raigarh with a natural honey-gold sheen and a rich, slightly textured feel."},
 {key:"tamil-nadu",     name:"Tamil Nadu",     region:"South",     weaves:["Kanchipuram","Arani Silk","Salem Silk","Coimbatore Cotton"],           motif:"temple",   base:"#1B5E4A", accent:"#C9A227", border:"#8E1B4A", note:"Kanchipuram silk is heavy, with a contrast border and pallu often woven separately and interlocked. Arani and Salem weave lighter silks for everyday occasions, and Coimbatore (Kovai) cotton is soft and breathable."},
 {key:"karnataka",      name:"Karnataka",      region:"South",     weaves:["Mysore Silk","Ilkal","Udupi Cotton","Molakalmuru Silk","Khana","Kollegal Silk"],            motif:"zari",     base:"#C2185B", accent:"#D4AF37", border:"#7A0E38", note:"Mysore silk is soft and luminous with a pure zari border. Ilkal joins its pallu with the tope teni loop, Udupi weaves light everyday cotton, Molakalmuru and Kollegal are known for silk, and Guledgudd's Khana has a fine woven texture."},
 {key:"kerala",         name:"Kerala",         region:"South",     weaves:["Balaramapuram","Kasaragod","Kuthampully","Chendamangalam"],                       motif:"kasavu",   base:"#F4ECD8", accent:"#C9A227", border:"#C9A227", note:"Kerala's handloom cottons in cream with gold or coloured borders: Balaramapuram's fine kasavu, Kuthampully's Onam sarees, Chendamangalam's crisp weaves and Kasaragod's soft cotton."},
 {key:"andhra-pradesh", name:"Andhra Pradesh", region:"South",     weaves:["Uppada Jamdani","Venkatagiri","Mangalagiri","Dharmavaram"],motif:"checks", base:"#1E6F5C", accent:"#E9C46A", border:"#8C2F39", note:"Featherlight Uppada jamdani with woven motifs, fine Venkatagiri cotton, crisp Mangalagiri with its nizam border, and heavy Dharmavaram silk with a broad zari border for weddings."},
 {key:"telangana",      name:"Telangana",      region:"South",     weaves:["Pochampally Ikat","Gadwal","Narayanpet","Gollabhama"],       motif:"ikat",     base:"#1D3557", accent:"#E63946", border:"#F1C453", note:"Pochampally's geometric ikat is tie-dyed thread by thread before weaving. Gadwal pairs a cotton body with a silk border, Narayanpet has a temple border, and Siddipet's Gollabhama carries the woven figure of a milkmaid."},
 {key:"west-bengal",    name:"West Bengal",    region:"East",      weaves:["Baluchari","Tant","Shantipuri Jamdani"],        motif:"jamdani",  base:"#F3EBDD", accent:"#8E1B1B", border:"#8E1B1B", note:"Baluchari pallus tell stories from the epics in woven silk. Tant is Bengal's everyday cotton — light, crisp, with a bold border."},
 {key:"odisha",         name:"Odisha",         region:"East",      weaves:["Sambalpuri Ikat","Bomkai","Khandua"],           motif:"ikat",     base:"#3B1F5C", accent:"#F4D35E", border:"#B23A48", note:"Sambalpuri ikat (bandha) carries conch, wheel and flower motifs. Bomkai adds a temple-spire border; Khandua is offered to Lord Jagannath."},
 {key:"bihar",          name:"Bihar",          region:"East",      weaves:["Bhagalpuri Tussar","Madhubani Painted"],        motif:"tussar",   base:"#CDA978", accent:"#6B2E1F", border:"#6B2E1F", note:"Bhagalpur is India's 'Silk City' — tussar with a raw, natural texture, often hand-painted in the Madhubani style."},
 {key:"jharkhand",      name:"Jharkhand",      region:"East",      weaves:["Tussar Silk"],                                  motif:"tussar",   base:"#B9935A", accent:"#3E5C2E", border:"#3E5C2E", note:"Much of India's tussar silk is reared in Jharkhand's forests — a golden, earthy silk with a gentle sheen."},
 {key:"assam",          name:"Assam",          region:"Northeast", weaves:["Muga Silk","Mekhela Chador","Eri Silk"],        motif:"muga",     base:"#C9A15B", accent:"#8B1E1E", border:"#8B1E1E", note:"Muga is found only in Assam — a golden silk whose shine grows with every wash. Also woven as the two-piece mekhela chador."},
 {key:"manipur",        name:"Manipur",        region:"Northeast", weaves:["Moirang Phee","Wangkhei Phee"],                 motif:"temple",   base:"#F1E7D0", accent:"#7B1E3A", border:"#7B1E3A", note:"Moirang Phee carries a row of temple-like triangles along the border; Wangkhei Phee is a fine, almost transparent cotton."},
 {key:"tripura",        name:"Tripura",        region:"Northeast", weaves:["Tripura Handloom Cotton"],                      motif:"stripes",  base:"#2F6B4F", accent:"#F2D16B", border:"#1B3F2E", note:"Tripura's weavers work on traditional loin and frame looms, in bold stripes and bright colours."}
];

export const FABRICS   = ["Silk", "Cotton", "Silk Cotton", "Tussar", "Linen", "Georgette", "Chiffon", "Organza", "Muga Silk", "Kosa Silk"];
export const OCCASIONS = ["Wedding", "Festive", "Party", "Office", "Daily wear"];


export const PHOTOS = {
  hero: ["/ekadashi/img/model-banarasi.jpg", "/ekadashi/img/model-kanjivaram.jpg", "/ekadashi/img/model-paithani.jpg", "/ekadashi/img/model-patola.jpg", "/ekadashi/img/model-bandhani.jpg"],   // big photos at the top (centre first)
  spot: ["/ekadashi/img/model-banarasi.jpg"], edit_bridal: ["/ekadashi/img/model-banarasi.jpg"],
  occ_Wedding: ["/ekadashi/img/model-banarasi.jpg"], occ_Festive: ["/ekadashi/img/model-paithani.jpg"], occ_Office: ["/ekadashi/img/model-tant.jpg"], "occ_Daily wear": ["/ekadashi/img/model-kasavu.jpg"], occ_Party: ["/ekadashi/img/model-bandhani.jpg"],
  "state_uttar-pradesh": ["/ekadashi/img/model-banarasi.jpg"],
  "state_tamil-nadu": ["/ekadashi/img/model-kanjivaram.jpg"],
  state_maharashtra: ["/ekadashi/img/model-paithani.jpg"],
  edit_festive: ["/ekadashi/img/model-paithani.jpg"],
  state_gujarat: ["/ekadashi/img/model-patola.jpg"],
  state_rajasthan: ["/ekadashi/img/model-bandhani.jpg"],
  state_kerala: ["/ekadashi/img/model-kasavu.jpg"],
  edit_cotton: ["/ekadashi/img/model-kasavu.jpg"],
  edit_gifting: ["/ekadashi/img/model-chanderi.jpg"],
  "state_west-bengal": ["/ekadashi/img/model-tant.jpg"],
  state_telangana: ["/ekadashi/img/model-pochampally.jpg"],
  state_odisha: ["/ekadashi/img/model-sambalpuri.jpg"],
  state_karnataka: ["/ekadashi/img/model-mysore.jpg"],
  "state_madhya-pradesh": ["/ekadashi/img/model-chanderi.jpg"],
  "state_andhra-pradesh": ["/ekadashi/img/model-uppada-blue.jpg"],
  state_assam: ["/ekadashi/img/model-muga.jpg"],
  state_punjab: ["/ekadashi/img/model-phulkari.jpg"],
  "state_jammu-kashmir": ["/ekadashi/img/model-tilla.jpg"],
  state_goa: ["/ekadashi/img/model-kunbi.jpg"],
  state_chhattisgarh: ["/ekadashi/img/model-kosa.jpg"],
  state_bihar: ["/ekadashi/img/model-madhubani.jpg"],
  state_jharkhand: ["/ekadashi/img/model-tussar.jpg"],
  state_manipur: ["/ekadashi/img/model-moirang.jpg"],
  state_tripura: ["/ekadashi/img/model-tripura.jpg"]
};

