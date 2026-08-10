export const IS_PREVIEW = true;
export const GAS_URL = "URL_DEPLOY_GAS_ANDA_DISINI";

export const initialBidangData = [
  {code:'01',name:'Sekretaris / Direktur'},
  {code:'02',name:'Kesiswaan, Humas & PPDB'},
  {code:'03',name:'Kurikulum LPIS'},
  {code:'04',name:'SEP LPIS'},
  {code:'05',name:'SMI LPIS'},
  {code:'06',name:'Bisnis'}
];

export const initialPejabatData = [
  {id:'1',nama:'Direktur LPIS',isDefault:true},
  {id:'2',nama:'Sekretaris Direktur',isDefault:false},
  {id:'3',nama:'Plt Asdir I',isDefault:false}
];

export const initialKategoriData = [
  {id:'1',nama:'Surat Masuk'},
  {id:'2',nama:'Surat Keluar'},
  {id:'3',nama:'Tembusan'},
  {id:'4',nama:'SK LPIS'},
  {id:'5',nama:'Sertifikat'}
];

export const defaultUsers = {
  'admin':{name:'Admin Utama',role:'admin',pass:'MTIzNA=='},
  'pimpinan':{name:'Pimpinan LPIS',role:'pimpinan',pass:'MTIzNA=='},
  'lpis':{name:'LPIS',role:'lpis',pass:'MTIzNA=='},
  'tkis1':{name:'TKIS 1',role:'tkis1',pass:'MTIzNA=='},
  'tkis2':{name:'TKIS 2',role:'tkis2',pass:'MTIzNA=='},
  'sdis1':{name:'SDIS 1',role:'sdis1',pass:'MTIzNA=='},
  'sdis2':{name:'SDIS 2',role:'sdis2',pass:'MTIzNA=='},
  'smpis':{name:'SMPIS',role:'smpis',pass:'MTIzNA=='},
  'smais':{name:'SMAIS',role:'smais',pass:'MTIzNA=='},
  'mahad':{name:'Mahad',role:'mahad',pass:'MTIzNA=='}
};

export const initialJenisSuratData = [
  {id:'1',nama:'Surat Dinas'},
  {id:'2',nama:'Surat Undangan'},
  {id:'3',nama:'Surat Keputusan'},
  {id:'4',nama:'Nota Dinas'},
  {id:'5',nama:'Memorandum'}
];

