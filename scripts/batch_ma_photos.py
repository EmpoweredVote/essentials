import urllib.request, os, io, pickle
from PIL import Image

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_legislators')
os.makedirs(OUT_DIR, exist_ok=True)

headers = {'User-Agent': 'TransparentMotivations/1.0 (gwashington@empowered.vote)'}

# (short_id, full_name, profile_code)
legislators = [
    ("e2daa3aa","Aaron L. Saunders","ALS1"),
    ("9cf147de","Aaron Michlewitz","AMM1"),
    ("78ae3786","Adam Gomez","A_G0"),
    ("c0852fa6","Adam J. Scanlon","AJS1"),
    ("290ee018","Adrian C. Madaro","ACM1"),
    ("ee861f58","Adrianne P. Ramos","APR1"),
    ("a646d95b","Alan Silvia","A_S1"),
    ("ac853e6e","Alice H. Peisch","AHP1"),
    ("7131c893","Alyson Sullivan-Almeida","AMS2"),
    ("2dcaf90d","Amy M. Sangiolo","AMS3"),
    ("19b7c45b","Andres X. Vargas","AXV1"),
    ("31aca73c","Andrew F. Tarr","AFT1"),
    ("9b3772d3","Angelo J. Puppolo","AJP1"),
    ("5e27127a","Antonio F. Cabral","AFC1"),
    ("15f59b0c","Barry R. Finegold","BRF0"),
    ("a6e1a867","Bradley H. Jones","BHJ1"),
    ("5c497509","Brandy Fluker-Reid","BFR1"),
    ("99457307","Brendan P. Crighton","BPC0"),
    ("1e83f9fc","Brian M. Ashe","BMA1"),
    ("4702bc3c","Brian W. Murray","BWM1"),
    ("63df70bd","Bridget M. Plouffe","BMP1"),
    ("b1bd9a21","Bruce E. Tarr","BET0"),
    ("3582a053","Bruce J. Ayers","BJA1"),
    ("aee5ccea","Bud L. Williams","BLW1"),
    ("64e0eeb2","Carlos Gonzalez","C_G1"),
    ("a9ea7006","Carmine L. Gentile","CLG1"),
    ("913143ad","Carole A. Fiola","CAF1"),
    ("7cbdb829","Christine P. Barber","CPB2"),
    ("9cb46542","Christopher Hendricks","C_H1"),
    ("bca54df2","Christopher J. Worrell","CJW1"),
    ("2270da0d","Christopher M. Markey","CMM1"),
    ("516feaaa","Christopher R. Flanagan","CRF1"),
    ("fd3bf15c","Chynah Tyler","C_T1"),
    ("c8f917f9","Colleen M. Garry","CMG1"),
    ("248f76d7","Cynthia F. Friedman","CFF0"),
    ("b46a6774","Cynthia S. Creem","CSC0"),
    ("ca6d9c06","Daniel F. Cahill","DFC1"),
    ("5c36a94c","Daniel J. Hunt","djh1"),
    ("6ab8e9cc","Daniel J. Ryan","djr1"),
    ("71aa11da","Daniel M. Donahue","DMD1"),
    ("3d9354a8","Danielle W. Gregoire","DWG1"),
    ("f8986c05","Danillo Sena","DAS1"),
    ("3ca6c1b2","David A. LeBoeuf","DAL1"),
    ("f5ab360a","David Biele","D_B1"),
    ("a743a9a0","David F. DeCoste","DFD1"),
    ("891030da","David K. Muradian","DKM1"),
    ("ffb8e526","David M. Rogers","DMR1"),
    ("fa6beaf8","David P. Linsky","DPL1"),
    ("f8ae17d7","David Robertson","D_R1"),
    ("35f10acb","David T. Vieira","DTV1"),
    ("8ee72aa5","Dawne Shand","D_S1"),
    ("17035eb6","Dennis C. Gallagher","DCG2"),
    ("44ca0b25","Donald H. Wong","DHW1"),
    ("329212d4","Donald R. Berthiaume","DRB1"),
    ("8c7d04dc","Dylan A. Fernandes","DAF0"),
    ("73afbe36","Edward R. Philips","ERP1"),
    ("98291d86","Erika Uyterhoeven","E_U1"),
    ("8e125ae2","Estela A. Reyes","EAR1"),
    ("77ceaab2","Francisco E. Paulino","FEP1"),
    ("5729a0a4","Frank A. Moran","FAM1"),
    ("8167ef8d","Greg Schwartz","G_S1"),
    ("03e35156","Hadley Luddy","H_L1"),
    ("d54b9791","Hannah E. Kane","HEK1"),
    ("b651cf67","Hannah L. Bowen","HLB1"),
    ("3ea88aee","Homar Gomez","H_G1"),
    ("04a9edee","Jack P. Lewis","JPL1"),
    ("ccb7cc4c","Jacob R. Oliveira","JRO0"),
    ("f392e7c6","James Arciero","J_A1"),
    ("ea8ed274","James Arena-DeRosa","JCD1"),
    ("9ed1b75f","James B. Eldridge","JBE0"),
    ("9b754d96","James J. ODay","JJO1"),
    ("95d5e111","James K. Hawkins","JKH1"),
    ("755d18f8","James M. Murphy","JMM1"),
    ("a40f234e","Jason M. Lewis","jml0"),
    ("852e4a21","Jay Livingstone","J_L1"),
    ("4024c884","Jeffrey N. Roy","JNR1"),
    ("c539c9fa","Jeffrey R. Turco","JRT1"),
    ("6148f954","Jennifer Balinsky Armini","JBA1"),
    ("1f4c93e7","Jessica A. Giannino","JAG1"),
    ("6d8717ca","Joan B. Lovely","JBL0"),
    ("502890e3","Joan Meschino","J_M1"),
    ("961506eb","Joanne M. Comerford","JMC0"),
    ("ecddb344","John Barrett","J_B1"),
    ("973d60e2","John C. Velis","JCV0"),
    ("5cd1c798","John F. Keenan","JFK0"),
    ("7cc9694b","John F. Moran","JFM1"),
    ("730f6bce","John H. Rogers","JHR1"),
    ("ef888471","John J. Cronin","JJC0"),
    ("baddd174","John J. Lawn","JJL2"),
    ("50838d91","John J. Mahoney","JJM2"),
    ("9dd7276b","John J. Marsi","JJM1"),
    ("08a2dfdf","John R. Gaskey","JRG2"),
    ("869ba820","Jonathan D. Zlotnik","JDZ1"),
    ("2fadc37b","Joseph D. McKenna","JDM1"),
    ("4a818693","Joseph W. McGonagle","jwm1"),
    ("de311b87","Joshua Tarsky","J_T1"),
    ("c4c3ed02","Judith A. Garcia","JAG2"),
    ("bd451748","Julian A. Cyr","JAC0"),
    ("a485b386","Justin Thurber","J_T2"),
    ("167d272b","Karen E. Spilka","KES0"),
    ("6eef204b","Kate Donaghue","K_D1"),
    ("e96eddbe","Kate Hogan","K_H1"),
    ("37e88d74","Kate Lipper-Garabedian","KLG1"),
    ("bb235d49","Kathleen P. LaNatra","KPL1"),
    ("247cf8e5","Kelly A. Dooner","KAD0"),
    ("296406bb","Kelly W. Pease","KWP1"),
    ("afb64fe5","Kenneth I. Gordon","KIG1"),
    ("8512ef88","Kenneth P. Sweezey","KPS1"),
    ("c7c8d91f","Kevin G. Honan","KGH1"),
    ("62aee074","Kimberly N. Ferguson","KNF1"),
    ("2386732f","Kip A. Diggs","KAD1"),
    ("36343ab4","Kristin Kassner","K_K2"),
    ("ca9208b4","Leigh S. Davis","LSD1"),
    ("853f0b26","Lindsay Sabadosa","L_S1"),
    ("acf7819a","Lisa M. Field","LMF1"),
    ("2f7d598c","Liz Miranda","L%20M0"),
    ("11d73e67","Lydia M. Edwards","LME0"),
    ("02eedd50","Manny Cruz","M_C3"),
    ("e2c3e1a7","Marc T. Lombardo","MTL1"),
    ("c9a23774","Marcus S. Vaughn","MSV1"),
    ("a0dc1cc3","Margaret R. Scarsdale","MRS1"),
    ("6f66ea3f","Mark C. Montigny","MCM0"),
    ("8658e02a","Mark D. Sylvia","MDS1"),
    ("99206e70","Mark J. Cusack","MJC1"),
    ("a6eb79f8","Mary S. Keefe","MSK1"),
    ("074555d9","Meghan Kilcoyne","M_K1"),
    ("67ea7814","Michael D. Brady","MDB0"),
    ("62764b2a","Michael F. Rush","MFR0"),
    ("60e4da77","Michael J. Barrett","MJB0"),
    ("949b1930","Michael J. Finn","MJF1"),
    ("9b3c9aa8","Michael J. Moran","MJM1"),
    ("f865995d","Michael J. Rodrigues","MJR0"),
    ("51e50b38","Michael J. Soter","MJS3"),
    ("c0b79f82","Michael O. Moore","MOM0"),
    ("d9b59bbc","Michael P. Kushmerek","MPK1"),
    ("69a4aaa2","Michael S. Chaisson","MSC1"),
    ("ff5cc07a","Michael S. Day","MSD1"),
    ("0748d787","Michelle Ciccolo","M_C2"),
    ("29af459c","Michelle L. Badger","MLB1"),
    ("75a2d83f","Michelle M. DuBois","MMD1"),
    ("49963775","Mike Connolly","M_C1"),
    ("ecafa801","Mindy Domb","M_D2"),
    ("c14b3502","Natalie Higgins","N_H1"),
    ("541efc37","Nicholas A. Boldyga","NAG1"),
    ("2c53dc2c","Nick Collins","N_C0"),
    ("c77f1324","Norman J. Orrall","NJO1"),
    ("ef8a23a0","Orlando Ramos","O_R1"),
    ("4a0609a0","Patricia A. Duffy","PAD1"),
    ("d40a0eda","Patricia D. Jehlen","PDJ0"),
    ("8c2553dd","Patrick J. Kearney","PJK1"),
    ("e1f72270","Patrick M. OConnor","PMO"),
    ("a73b7873","Paul J. Donato","PJD1"),
    ("799c1cea","Paul K. Frost","PKF1"),
    ("5020a35d","Paul McMurtry","P_M1"),
    ("c435ab14","Paul R. Feeney","PRF0"),
    ("f530be83","Paul W. Mark","PWM0"),
    ("756f9e6b","Pavel M. Payano","PMP0"),
    ("82943cda","Peter J. Durant","PJD0"),
    ("2ada2d01","Priscila S. Sousa","PSS1"),
    ("b7369e32","Rebecca L. Rausch","RLR0"),
    ("a3131d21","Richard G. Wells","RGW1"),
    ("2d3def44","Richard M. Haggerty","RMH1"),
    ("042c79d6","Rita A. Mendes","RAM1"),
    ("3f5dd4b3","Rob Consalvo","R_C1"),
    ("e47f2082","Robyn K. Kennedy","RKK0"),
    ("751464b8","Rodney M. Elliott","RME1"),
    ("5fdefd59","Ronald Mariano","R_M1"),
    ("e96b35eb","Russell E. Holmes","REH1"),
    ("785c2d95","Ryan C. Fattman","RCF0"),
    ("bdc19d3c","Ryan M. Hamilton","RMH2"),
    ("de40220c","Sally P. Kerans","SPK1"),
    ("28a703f8","Samantha Montano","S_M1"),
    ("7072bd94","Sean Garballey","S_G1"),
    ("444ac209","Sean Reid","S_R1"),
    ("8995a410","Shirley A. Arriaga","SBA1"),
    ("918296a2","Simon Cataldo","S_C1"),
    ("1d78debb","Steven C. Owens","SCO1"),
    ("892670a6","Steven G. Xiarhos","SGX1"),
    ("a4e6e14a","Steven J. Ouellette","SJO1"),
    ("3107f5d0","Steven S. Howitt","SSH1"),
    ("0cb5bf41","Steven Ultrino","S_G2"),
    ("9081c52c","Susannah L. Whipps","SLG1"),
    ("90602902","Tackey Chan","T_C1"),
    ("18477533","Tara T. Hong","TTH1"),
    ("ff2939e8","Thomas J. Walsh","TJW1"),
    ("c70bd1f2","Thomas M. Stanley","TMS1"),
    ("35cf0880","Thomas W. Moakley","TWM1"),
    ("aca1e324","Todd M. Smola","TMS2"),
    ("001147b2","Tommy Vitolo","T_V1"),
    ("fc1d7143","Tram T. Nguyen","TTN1"),
    ("15c27efb","Tricia Farley-Bouvier","TFB1"),
    ("c947719a","Vanna Howard","V_H0"),
    ("78f3bb2d","William C. Galvin","WCG1"),
    ("194b9b91","William F. MacGregor","WFM1"),
    ("ab975fdf","William J. Driscoll","WJD0"),
    ("8a63eab9","William N. Brownsberger","WNB0"),
]

full_ids = {
    "e2daa3aa":"e2daa3aa-02b6-4a4d-859b-fb75f674625b","9cf147de":"9cf147de-64e0-4116-b461-95933e18c423",
    "78ae3786":"78ae3786-e71e-4dc4-8b84-0ab28b555632","c0852fa6":"c0852fa6-8184-4f2d-b1cf-fde8cbf3c4b2",
    "290ee018":"290ee018-6e9e-4a8c-9561-385cf5ef3d73","ee861f58":"ee861f58-dabf-429f-97ee-32591bdd3650",
    "a646d95b":"a646d95b-7341-4181-a25b-87b5abcf0a6c","ac853e6e":"ac853e6e-d419-4d05-b89c-77d11bb68fb2",
    "7131c893":"7131c893-90fc-4c27-b4f6-e3fc8fcf6ec2","2dcaf90d":"2dcaf90d-f476-4fcf-af03-3d0a7aa5d3bf",
    "19b7c45b":"19b7c45b-57a7-468c-9762-82b926080646","31aca73c":"31aca73c-2006-49d2-901c-89ee2a13acb5",
    "9b3772d3":"9b3772d3-3602-457a-82e7-479b5e557b13","5e27127a":"5e27127a-4df3-4d16-a1a4-2bf081c92842",
    "15f59b0c":"15f59b0c-f71c-4199-b195-7b653a05a310","a6e1a867":"a6e1a867-1e4e-449f-bb10-4f55449762bf",
    "5c497509":"5c497509-7a9d-492b-ac35-ff37f8fcfb82","99457307":"99457307-afa4-4045-aebf-06ee8b39d28f",
    "1e83f9fc":"1e83f9fc-43c9-4568-937d-94383acdc117","4702bc3c":"4702bc3c-0820-42f4-a0ae-5bc244c44159",
    "63df70bd":"63df70bd-91d8-4576-8136-d2128ea5e9b9","b1bd9a21":"b1bd9a21-a37e-49f4-907b-9fba480a1ca2",
    "3582a053":"3582a053-ee20-4391-904f-3905a2d13a52","aee5ccea":"aee5ccea-d3ca-426c-9849-fbfc5e297e2a",
    "64e0eeb2":"64e0eeb2-c83a-4da4-b6a2-2047b1e25cab","a9ea7006":"a9ea7006-d595-45aa-a301-9c71d5a3af4d",
    "913143ad":"913143ad-c39b-4dde-9a93-8252a98b0181","7cbdb829":"7cbdb829-4836-49e9-afb2-cb8035afc6bf",
    "9cb46542":"9cb46542-a671-4bdd-bfcb-98fc1bc79415","bca54df2":"bca54df2-f059-44ce-81c3-f208f1e20752",
    "2270da0d":"2270da0d-09e7-40b4-858f-fe25bc822916","516feaaa":"516feaaa-7086-4382-8cfa-9463f508dd74",
    "fd3bf15c":"fd3bf15c-265b-46a9-aa72-c9097749d762","c8f917f9":"c8f917f9-f6c4-49f8-b5a4-c330b07f90d2",
    "248f76d7":"248f76d7-e76a-49e5-88b7-dc43a3131329","b46a6774":"b46a6774-2d85-4750-813a-6d4ef2eefb5b",
    "ca6d9c06":"ca6d9c06-e613-46a1-b938-0d89d488b583","5c36a94c":"5c36a94c-9006-4550-a37e-978a65d2725c",
    "6ab8e9cc":"6ab8e9cc-6315-40d8-bb99-eb00faed61fa","71aa11da":"71aa11da-0fa1-49d2-bcbd-3bce7d0bad2b",
    "3d9354a8":"3d9354a8-e7ee-4381-b91a-a40d0a2e8d3a","f8986c05":"f8986c05-2e32-4184-bfb2-9d4c244ffd3a",
    "3ca6c1b2":"3ca6c1b2-eec3-4e28-991d-fce8b6b67354","f5ab360a":"f5ab360a-7ec0-4af9-8d9a-1eb17e842b9f",
    "a743a9a0":"a743a9a0-711c-40cf-b6e2-0ce2b587949a","891030da":"891030da-39e2-496f-8a20-72aeb27093ba",
    "ffb8e526":"ffb8e526-7ad7-4911-92c5-d69528a0f280","fa6beaf8":"fa6beaf8-acfe-4365-82a2-6f282aa1b688",
    "f8ae17d7":"f8ae17d7-bc53-4b74-a92e-efa122cd5f04","35f10acb":"35f10acb-fe09-40eb-a847-195fffee6f25",
    "8ee72aa5":"8ee72aa5-b7a0-422f-817d-a330f29dd2b1","17035eb6":"17035eb6-e7d3-4372-9b96-0741adb57468",
    "44ca0b25":"44ca0b25-e4b9-4409-8407-f5119568be3e","329212d4":"329212d4-14ef-4685-9d95-cc7473aad949",
    "8c7d04dc":"8c7d04dc-f567-4759-b99b-0ae8f26d6f32","73afbe36":"73afbe36-aa0c-4474-a2fc-6ff13bf20d71",
    "98291d86":"98291d86-d42d-49d0-a5b2-d689a8154b15","8e125ae2":"8e125ae2-3101-49b1-b228-f172ad9c70d9",
    "77ceaab2":"77ceaab2-846e-4bc8-b09d-faff40ddbc60","5729a0a4":"5729a0a4-40a9-41bd-82a4-9a0bea757567",
    "8167ef8d":"8167ef8d-b8c8-44aa-86a2-9128c9078547","03e35156":"03e35156-c179-4dd5-9c8c-8d418976914e",
    "d54b9791":"d54b9791-0668-4397-b488-160d06f7c420","b651cf67":"b651cf67-37b4-4cbf-afcd-088010247788",
    "3ea88aee":"3ea88aee-8bc7-4ddf-b897-5aa8111fadc8","04a9edee":"04a9edee-5d51-49f3-a2c9-585e2231bd08",
    "ccb7cc4c":"ccb7cc4c-2c8f-4590-a3a2-f8e4bfbd64d5","f392e7c6":"f392e7c6-0ab2-4834-9a57-df86541f55d3",
    "ea8ed274":"ea8ed274-32d6-499d-a787-7ad1f0624280","9ed1b75f":"9ed1b75f-a314-4241-87ff-231de4aba963",
    "9b754d96":"9b754d96-e0e7-4f6b-b3ae-e0d1c12ef1bf","95d5e111":"95d5e111-b7dd-4440-8b51-070b72e33126",
    "755d18f8":"755d18f8-8c99-4d41-93eb-4f154d9bb7a9","a40f234e":"a40f234e-1790-4b52-8670-090b6379eb03",
    "852e4a21":"852e4a21-5750-4ac8-ba06-0376c5a31685","4024c884":"4024c884-6627-4496-b3ff-5e91862bf894",
    "c539c9fa":"c539c9fa-a531-456f-9125-8d30f1fcedfe","6148f954":"6148f954-b8cc-4204-96ca-34f2afc1d24a",
    "1f4c93e7":"1f4c93e7-37a6-4577-a2bc-d77218ad1feb","6d8717ca":"6d8717ca-45f9-42cf-bd28-6786a50d254f",
    "502890e3":"502890e3-ad59-4d40-88a4-3cdee03f025e","961506eb":"961506eb-3f00-4358-a9a3-1730e7004474",
    "ecddb344":"ecddb344-846b-4b7d-b712-3a7db8b47ef6","973d60e2":"973d60e2-fca7-4185-bd2a-84a686e925ab",
    "5cd1c798":"5cd1c798-31dc-4e53-b578-7e2d81378478","7cc9694b":"7cc9694b-3bca-44ec-ab75-762c1f6d5136",
    "730f6bce":"730f6bce-4d8c-4ad0-897b-f687971a4d87","ef888471":"ef888471-24a9-4a9f-9115-e530c16986ae",
    "baddd174":"baddd174-93ea-47b6-9cbd-c48fc3acf2f6","50838d91":"50838d91-2ce4-4aa6-8950-b87579860a4b",
    "9dd7276b":"9dd7276b-1c24-466c-a530-d2297607a784","08a2dfdf":"08a2dfdf-43fb-408a-b758-aa94497fd871",
    "869ba820":"869ba820-3138-473c-b70d-383e67f5797d","2fadc37b":"2fadc37b-4d33-46b4-a3cc-a2ca5ebeb39a",
    "4a818693":"4a818693-d820-4f4a-94b7-3d43a2381e1c","de311b87":"de311b87-1026-4f61-8e42-110b90491160",
    "c4c3ed02":"c4c3ed02-2592-4505-a26c-0195d0b5314e","bd451748":"bd451748-111f-461d-9752-95e7c243769e",
    "a485b386":"a485b386-65a5-4c6c-aaa1-a441facd45fc","167d272b":"167d272b-fc1b-4a72-a44d-dfa1a9a42fcf",
    "6eef204b":"6eef204b-5d35-48e6-bf8c-dd3cac62e2cd","e96eddbe":"e96eddbe-4a4a-4499-8102-636f0cfac10e",
    "37e88d74":"37e88d74-8fdf-4a66-8685-989248512b29","bb235d49":"bb235d49-c91a-45da-8d91-bf3d5b766196",
    "247cf8e5":"247cf8e5-426a-4104-9027-6a2a0b1b61c9","296406bb":"296406bb-cc2a-4214-978f-d30333d62939",
    "afb64fe5":"afb64fe5-b2a7-4c47-b113-5200ed26182a","8512ef88":"8512ef88-a285-4c6f-89d3-41fb4f8cfd48",
    "c7c8d91f":"c7c8d91f-156b-42ea-93f1-7dac0c4080a4","62aee074":"62aee074-7ed1-45e8-94fc-3b5b5007f85d",
    "2386732f":"2386732f-e3af-4b76-8c34-1c8ff7fa2f4d","36343ab4":"36343ab4-817f-44eb-9221-15eb338af57a",
    "ca9208b4":"ca9208b4-47c6-4a4e-8d8f-62d6e179d7f4","853f0b26":"853f0b26-a2b5-48b6-8dd6-f40ca48c87fd",
    "acf7819a":"acf7819a-3e36-4d17-8828-3238adb894b0","2f7d598c":"2f7d598c-c3d7-48ba-ac9c-fb059e032bfe",
    "11d73e67":"11d73e67-bcd9-419a-8b0d-a26447eb0c0b","02eedd50":"02eedd50-b5a5-48dd-b1a4-9b5220bf7e8e",
    "e2c3e1a7":"e2c3e1a7-78b2-4c90-a136-c0a22c3f3e48","c9a23774":"c9a23774-469d-4c40-b316-7fbd46dab7d9",
    "a0dc1cc3":"a0dc1cc3-efcf-4109-9f9b-4d8b36452361","6f66ea3f":"6f66ea3f-d5a3-4a51-96be-58aa0097bfc0",
    "8658e02a":"8658e02a-1456-45ba-96bb-19ff438d8e1b","99206e70":"99206e70-8173-4d6c-803c-1ae2d1109e30",
    "a6eb79f8":"a6eb79f8-c7e7-41b0-8a1c-baf85e7cd22c","074555d9":"074555d9-2806-4f78-bce9-1958d61742c6",
    "67ea7814":"67ea7814-b7aa-42de-aba8-2230c181d15a","62764b2a":"62764b2a-5b54-4edb-9c69-06320cbebbad",
    "60e4da77":"60e4da77-0c2b-4ca4-8d02-a4210bd91d90","949b1930":"949b1930-0574-44f5-9389-efc75c654139",
    "9b3c9aa8":"9b3c9aa8-d22a-4761-93e3-8054c762f4a5","f865995d":"f865995d-ad3a-4d2d-827f-ed8a1a67af18",
    "51e50b38":"51e50b38-dbb2-4131-91bb-23c24bf6d741","c0b79f82":"c0b79f82-6ce7-413a-a18a-286c9a8fa5fd",
    "d9b59bbc":"d9b59bbc-90e5-435e-8c46-d8b555f1b932","69a4aaa2":"69a4aaa2-5265-45e0-87c7-8cea22b2dc18",
    "ff5cc07a":"ff5cc07a-b904-4365-bcac-027bb50e8a8e","0748d787":"0748d787-7e5d-4852-b461-3459312fae45",
    "29af459c":"29af459c-8142-487d-bb51-2224983faca3","75a2d83f":"75a2d83f-8db8-478b-a36d-5ecb707b8507",
    "49963775":"49963775-d2d5-4ae2-95cf-b2b8d0ed2a92","ecafa801":"ecafa801-15b3-4777-9c38-95f5ded5cbe6",
    "c14b3502":"c14b3502-f142-4c1f-bfa9-a8fa52351a8e","541efc37":"541efc37-b332-4c80-8264-7b655efed5ac",
    "2c53dc2c":"2c53dc2c-38ae-4f39-873d-9ea1841b1c4c","c77f1324":"c77f1324-a106-4d45-a044-0174bddfe8e0",
    "ef8a23a0":"ef8a23a0-7f93-425c-a773-dcec9eb96dfb","4a0609a0":"4a0609a0-7073-4de1-9bf8-b3ecaebc9638",
    "d40a0eda":"d40a0eda-36fc-4032-8382-20c76a36d6a6","8c2553dd":"8c2553dd-437e-4614-89ab-f54031bc418e",
    "e1f72270":"e1f72270-5809-4d0e-969c-48d1ab34fbdc","a73b7873":"a73b7873-74df-484f-bfab-3b0d905972d9",
    "799c1cea":"799c1cea-4020-4c50-b7d1-1e9aac867529","5020a35d":"5020a35d-1f0c-44f7-b533-4e5e457238b5",
    "c435ab14":"c435ab14-5d64-46e4-a59f-bba18ed483c9","f530be83":"f530be83-6f1b-4b04-a8c4-3a83dc35099f",
    "756f9e6b":"756f9e6b-5286-4a9e-9d05-f6341830bd12","82943cda":"82943cda-5803-46c7-a854-697ad6052eda",
    "2ada2d01":"2ada2d01-a77a-44f6-a569-916d9639fbdc","b7369e32":"b7369e32-1916-413e-b0eb-2871a5348470",
    "a3131d21":"a3131d21-f3ad-4483-ac6d-13c9c7ecdd74","2d3def44":"2d3def44-9916-469d-8f8f-b098ad896768",
    "042c79d6":"042c79d6-2f15-4e90-b672-ce779a53cae0","3f5dd4b3":"3f5dd4b3-c0b6-470b-861d-41a71637797c",
    "e47f2082":"e47f2082-6fcb-4961-9df5-c5fb94004b59","751464b8":"751464b8-069c-4a7e-b21b-06d36c338060",
    "5fdefd59":"5fdefd59-b543-4221-b6ed-b33532f9bd5f","e96b35eb":"e96b35eb-dad1-4a29-b416-d9b10838840f",
    "785c2d95":"785c2d95-9d99-41c9-b903-7aab661f8928","bdc19d3c":"bdc19d3c-1169-4923-9ed9-f914b73f63e9",
    "de40220c":"de40220c-2935-42a2-ac90-d662bb47d49b","28a703f8":"28a703f8-8316-4d3c-bfc0-3dcd77eab96c",
    "7072bd94":"7072bd94-b465-414e-bcf5-6e3feb7ec8dd","444ac209":"444ac209-7bfa-4f3a-a733-5666fd74fd66",
    "8995a410":"8995a410-276d-4a84-87f2-b097c1535f90","918296a2":"918296a2-5def-4ddf-8986-860d542900e7",
    "1d78debb":"1d78debb-efd5-45e8-9204-06aab3076b2a","892670a6":"892670a6-f15f-4014-86a8-434090c2a514",
    "a4e6e14a":"a4e6e14a-46f7-4574-94c6-5b7edd484d91","3107f5d0":"3107f5d0-2cfd-43bc-a8eb-6b8ddc75bfc1",
    "0cb5bf41":"0cb5bf41-db67-4c4e-b4cf-79c4e4e8dcd7","9081c52c":"9081c52c-92ea-4a75-84b1-96305fafd333",
    "90602902":"90602902-b178-4709-a74b-68b30fe45394","18477533":"18477533-2ddf-47dd-8fc3-8eb8e65ccb2f",
    "ff2939e8":"ff2939e8-befb-4c16-ace7-9f677847088c","c70bd1f2":"c70bd1f2-6ba2-446e-a40c-d07f446db214",
    "35cf0880":"35cf0880-be86-45bb-97e9-4ef2097feba1","aca1e324":"aca1e324-cc09-4492-a2f7-d795beb752ff",
    "001147b2":"001147b2-5c07-499e-85b9-bae224fdc73a","fc1d7143":"fc1d7143-1be8-49b0-be31-6dbc5874230d",
    "15c27efb":"15c27efb-0402-4a3a-bfad-9df152874046","c947719a":"c947719a-cd1a-497a-8fc9-d9c4d434b18f",
    "78f3bb2d":"78f3bb2d-90e4-4263-925e-6203385bc6eb","194b9b91":"194b9b91-6986-423e-89a0-ee9750f275d8",
    "ab975fdf":"ab975fdf-b4f1-4955-94a4-97681a2a8d08","8a63eab9":"8a63eab9-1b32-48c6-ab4e-ba96c12ec5e7",
}


def detect_head_top(img):
    w, h = img.size
    rgb = img.convert('RGB').load()
    for y in range(h):
        hair = sum(1 for x in range(w)
            if rgb[x,y][0] < 90 and rgb[x,y][1] < 90 and rgb[x,y][2] < 90
            and rgb[x,y][2] < rgb[x,y][0] + 30)
        if hair > w * 0.06:
            return y
    for y in range(h):
        skin = sum(1 for x in range(w) if rgb[x,y][0] > 100 and rgb[x,y][0] > rgb[x,y][2] + 20)
        if skin > w * 0.08:
            return y
    return None


def process_image(data, short_id, code):
    pid = full_ids[short_id]
    img = Image.open(io.BytesIO(data))
    w, h = img.size
    warnings = []
    aspect = w / h
    if aspect > 0.95:
        warnings.append(f"BAD_ASPECT({w}x{h})")
        return warnings, None
    target_h = int(w * 5 / 4)
    if target_h > h:
        target_w = int(h * 4 / 5)
        left = (w - target_w) // 2
        cropped = img.crop((left, 0, left + target_w, h))
    else:
        top = (h - target_h) // 2
        cropped = img.crop((0, top, w, top + target_h))
    head_top = detect_head_top(cropped)
    cw, ch = cropped.size
    if head_top is not None:
        headspace_pct = head_top / ch * 100
        if head_top < 12:
            warnings.append(f"TIGHT_TOP(head@{head_top}px)")
        elif headspace_pct > 15:
            crop_top = max(0, head_top - 12)
            cropped = cropped.crop((0, crop_top, cw, ch))
            warnings.append(f"AUTOCROPPED({headspace_pct:.0f}%)")
    final = cropped.resize((600, 750), Image.LANCZOS)
    outpath = os.path.join(OUT_DIR, f"{pid}.jpg")
    final.save(outpath, 'JPEG', quality=90)
    return warnings, outpath


ok, flagged, failed = [], [], []
print(f"Processing {len(legislators)} legislators...")
for i, (short_id, name, code) in enumerate(legislators):
    url = f"https://malegislature.gov/Legislators/Profile/170/{code}.jpg"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        warnings, outpath = process_image(data, short_id, code)
        pid = full_ids[short_id]
        if outpath is None:
            flagged.append((pid, name, code, warnings))
        elif warnings:
            flagged.append((pid, name, code, warnings))
        else:
            ok.append((pid, name, code))
    except Exception as e:
        failed.append((full_ids[short_id], name, code, str(e)))
    if (i+1) % 25 == 0:
        print(f"  {i+1}/{len(legislators)} done")

print(f"\n=== RESULTS ===")
print(f"Clean (ready to import): {len(ok)}")
print(f"Flagged (need review):   {len(flagged)}")
print(f"Failed (download error): {len(failed)}")
if flagged:
    print(f"\nFlagged:")
    for pid, name, code, warns in flagged:
        print(f"  {name} ({code}): {', '.join(warns)}")
if failed:
    print(f"\nFailed:")
    for pid, name, code, err in failed:
        print(f"  {name} ({code}): {err}")

with open(os.path.join(TEMP, 'ma_batch_results.pkl'), 'wb') as f:
    pickle.dump({'ok': ok, 'flagged': flagged, 'failed': failed}, f)
print("\nSaved.")
