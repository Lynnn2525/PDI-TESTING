/* Captain Barbershop - versi HTML/CSS/JavaScript sederhana.
   Data disimpan di localStorage browser, bukan database server bersama. */
"use strict";
const KEYS = { bookings: "captainBarbershopBookings", oldBookings: "bookings", users: "captainBarbershopUsers", session: "captainBarbershopSession", blocked: "captainBarbershopBlockedSlots" };
const ADMIN = { name: "Admin Captain", email: "admin@captainbarbershop.local", password: "Admin123!", role: "admin" };
const START_TIME = "09:00", END_TIME = "21:00";
function readList(key, fallback=[]) { try { const v=JSON.parse(localStorage.getItem(key)); return Array.isArray(v)?v:fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { alert("Data tidak dapat disimpan di browser ini."); return false; } }
let bookings = readList(KEYS.bookings, readList(KEYS.oldBookings));
let users = readList(KEYS.users);
let blockedSlots = readList(KEYS.blocked);
const session = () => { try { return JSON.parse(localStorage.getItem(KEYS.session) || "null"); } catch { return null; } };
const saveBookings = () => write(KEYS.bookings, bookings) && write(KEYS.oldBookings, bookings);
const dateString = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const minDate = () => { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+1); return dateString(d); };
const val = id => document.getElementById(id)?.value.trim() || "";
const msg = (id, text, type="success") => { const e=document.getElementById(id); if(e){e.textContent=text;e.className=`form-message ${type}`;} };
const isAdmin = () => session()?.role === "admin";
function requireLogin() { if (!session()) { window.location.href="login.html"; return false; } return true; }
function requireAdmin() { if (!isAdmin()) { alert("Halaman ini hanya dapat diakses admin."); window.location.href=session()?"bookings.html":"login.html"; return false; } return true; }
function updateNavigation() {
  const nav=document.querySelector("nav"); if(!nav) return;
  const old=document.getElementById("sessionNav"); if(old) old.remove();
  const user=session();
  if(user){
    const label=document.createElement("span"); label.id="sessionNav"; label.className="nav-user"; label.textContent=`${user.name} (${user.role === "admin" ? "Admin" : "Pelanggan"})`;
    nav.append(label);
    if(user.role === "admin" && !document.querySelector('nav a[href="schedule.html"]')) { const a=document.createElement("a"); a.href="schedule.html"; a.textContent="Jadwal Barber"; nav.append(a); }
    const out=document.createElement("a"); out.href="#"; out.textContent="Logout"; out.addEventListener("click",e=>{e.preventDefault();localStorage.removeItem(KEYS.session);window.location.href="index.html";}); nav.append(out);
  }
}
function initAuth() {
  const login=document.getElementById("loginForm");
  if(login) login.addEventListener("submit",e=>{e.preventDefault(); const email=val("loginEmail").toLowerCase(), password=val("loginPassword");
    if(email===ADMIN.email && password===ADMIN.password){localStorage.setItem(KEYS.session,JSON.stringify({name:ADMIN.name,email:ADMIN.email,role:"admin"}));window.location.href="bookings.html";return;}
    const user=users.find(u=>u.email.toLowerCase()===email && u.password===password);
    if(!user){msg("loginMessage","Email atau password salah.","error");return;}
    localStorage.setItem(KEYS.session,JSON.stringify({name:user.name,email:user.email,role:"customer"}));window.location.href="booking.html";
  });
  const register=document.getElementById("registerForm");
  if(register) register.addEventListener("submit",e=>{e.preventDefault(); const name=val("registerName"), email=val("registerEmail").toLowerCase(), password=val("registerPassword");
    if(users.some(u=>u.email.toLowerCase()===email) || email===ADMIN.email){msg("registerMessage","Email sudah terdaftar.","error");return;}
    if(password.length<6){msg("registerMessage","Password minimal 6 karakter.","error");return;}
    users.push({id:Date.now().toString(),name,email,password,role:"customer"}); if(!write(KEYS.users,users)){users.pop();return;} msg("registerMessage","Pendaftaran berhasil. Silakan login."); register.reset();
  });
}
function hasConflict(candidate, excludeId=null) {
  const booked=bookings.some(b=>String(b.id)!==String(excludeId) && b.date===candidate.date && b.time===candidate.time && b.barber===candidate.barber && b.status!=="Dibatalkan");
  const blocked=blockedSlots.some(s=>s.date===candidate.date && s.time===candidate.time && s.barber===candidate.barber);
  return booked || blocked;
}
function initBookingForm() {
  const form=document.getElementById("form"); if(!form) return;
  if(!requireLogin()) return;
  const user=session(); const name=document.getElementById("name"), email=document.getElementById("email");
  if(user.role==="customer"){ if(name && !name.value) name.value=user.name; if(email && !email.value) email.value=user.email; }
  const date=document.getElementById("date"); if(date) date.min=minDate();
  form.addEventListener("submit",e=>{e.preventDefault(); const userNow=session(); const b={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name:val("name"),email:val("email"),phone:val("phone"),date:val("date"),time:val("time"),service:val("service"),barber:val("barber"),note:val("note"),status:"Menunggu",createdAt:new Date().toISOString(),customerEmail:userNow.email};
    if([b.name,b.email,b.phone,b.date,b.time,b.service,b.barber].some(x=>!x)){msg("formMessage","Mohon lengkapi semua kolom wajib.","error");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)){msg("formMessage","Format email belum benar.","error");return;}
    if(!/^[0-9+() -]{8,20}$/.test(b.phone)){msg("formMessage","Format nomor HP belum benar.","error");return;}
    if(b.date<minDate()){msg("formMessage","Reservasi harus dilakukan minimal satu hari sebelumnya.","error");return;}
    if(b.time<START_TIME || b.time>=END_TIME){msg("formMessage","Pilih jam antara 09:00 dan sebelum 21:00.","error");return;}
    if(hasConflict(b)){msg("formMessage","Jadwal ini sudah dipesan atau diblokir. Pilih waktu/barber lain.","error");return;}
    bookings.push(b); if(!saveBookings()){bookings.pop();return;} form.reset(); if(date)date.min=minDate(); msg("formMessage","Booking berhasil disimpan. Status: Menunggu."); updateBookingCount();
  });
}
function cell(text){const td=document.createElement("td");td.textContent=text||"—";return td;}
function renderBookings(query="") {
  const tbody=document.getElementById("table");if(!tbody)return;
  const user=session(); const q=query.trim().toLowerCase();
  const visible=bookings.filter(b=>(isAdmin() || (user && (b.customerEmail||b.email).toLowerCase()===user.email.toLowerCase())) && [b.name,b.email,b.barber,b.service,b.status].join(" ").toLowerCase().includes(q));
  tbody.replaceChildren(); const empty=document.getElementById("emptyState"); if(empty){empty.hidden=visible.length>0;empty.textContent=bookings.length===0?"Belum ada booking tersimpan.":"Tidak ada booking yang cocok.";}
  visible.forEach(b=>{const tr=document.createElement("tr");tr.append(cell(b.name),cell(b.email),cell(b.phone),cell(b.date),cell(b.time),cell(b.service),cell(b.barber));
    const statusTd=document.createElement("td");
    if(isAdmin()) { const sel=document.createElement("select"); ["Menunggu","Dikonfirmasi","Selesai","Dibatalkan"].forEach(st=>{const op=document.createElement("option");op.value=st;op.textContent=st;sel.append(op);});sel.value=b.status||"Menunggu";sel.addEventListener("change",()=>{const old=b.status;b.status=sel.value;if(!saveBookings()){b.status=old;sel.value=old;} });statusTd.append(sel); }
    else statusTd.textContent=b.status||"Menunggu";
    tr.append(statusTd,cell(b.note));const actions=document.createElement("td");actions.className="table-actions";
    if(isAdmin()){const edit=document.createElement("button");edit.type="button";edit.className="small-button";edit.textContent="Edit";edit.addEventListener("click",()=>editBooking(b.id));actions.append(edit);}
    if(isAdmin() || ((b.customerEmail||b.email).toLowerCase()===user.email.toLowerCase() && (b.status||"Menunggu")==="Menunggu")){const del=document.createElement("button");del.type="button";del.className="small-button danger";del.textContent=isAdmin()?"Hapus":"Batalkan";del.addEventListener("click",()=>deleteBooking(b.id));actions.append(del);}
    tr.append(actions);tbody.append(tr);
  });
}
function editBooking(id){const b=bookings.find(x=>String(x.id)===String(id));if(!b||!isAdmin())return;
  const name=prompt("Edit nama",b.name);if(name===null)return;const email=prompt("Edit email",b.email);if(email===null)return;const phone=prompt("Edit nomor HP",b.phone);if(phone===null)return;
  if(!name.trim()||!email.trim()||!phone.trim()){alert("Data tidak boleh kosong.");return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){alert("Email tidak valid.");return;}if(!/^[0-9+() -]{8,20}$/.test(phone.trim())){alert("Nomor HP tidak valid.");return;}
  const old={...b};Object.assign(b,{name:name.trim(),email:email.trim(),phone:phone.trim()});if(!saveBookings())Object.assign(b,old);renderBookings(document.getElementById("search")?.value||"");
}
function deleteBooking(id){const b=bookings.find(x=>String(x.id)===String(id));if(!b)return;const user=session();if(!isAdmin() && (!user || (b.customerEmail||b.email).toLowerCase()!==user.email.toLowerCase() || (b.status||"Menunggu")!=="Menunggu"))return;
  if(!confirm(`${isAdmin()?"Hapus":"Batalkan"} booking atas nama ${b.name}?`))return;
  if(isAdmin()){const old=bookings;bookings=bookings.filter(x=>String(x.id)!==String(id));if(!saveBookings())bookings=old;}else{const old=b.status;b.status="Dibatalkan";if(!saveBookings())b.status=old;}
  renderBookings(document.getElementById("search")?.value||"");updateBookingCount();
}
function updateBookingCount(){const el=document.getElementById("bookingCount");if(el)el.textContent=String(bookings.length);}
function initSearch(){const input=document.getElementById("search");if(input)input.addEventListener("input",()=>renderBookings(input.value));}
function initSchedule(){const form=document.getElementById("scheduleForm");if(!form)return;if(!requireAdmin())return;const date=document.getElementById("scheduleDate");if(date)date.min=minDate();
  const draw=()=>{const list=document.getElementById("scheduleList");list.replaceChildren();if(!blockedSlots.length){list.textContent="Belum ada jadwal yang diblokir.";return;}blockedSlots.forEach(s=>{const item=document.createElement("div");item.className="schedule-item";const text=document.createElement("span");text.textContent=`${s.barber} — ${s.date}, ${s.time}${s.note?" · "+s.note:""}`;const btn=document.createElement("button");btn.type="button";btn.className="small-button danger";btn.textContent="Hapus";btn.addEventListener("click",()=>{blockedSlots=blockedSlots.filter(x=>x.id!==s.id);write(KEYS.blocked,blockedSlots);draw();});item.append(text,btn);list.append(item);});};
  form.addEventListener("submit",e=>{e.preventDefault();const s={id:String(Date.now()),barber:val("scheduleBarber"),date:val("scheduleDate"),time:val("scheduleTime"),note:val("scheduleNote")};if(!s.barber||!s.date||!s.time){msg("scheduleMessage","Lengkapi barber, tanggal, dan jam.","error");return;}if(s.date<minDate()){msg("scheduleMessage","Tanggal harus minimal satu hari ke depan.","error");return;}if(blockedSlots.some(x=>x.barber===s.barber&&x.date===s.date&&x.time===s.time)){msg("scheduleMessage","Jadwal tersebut sudah diblokir.","error");return;}blockedSlots.push(s);if(!write(KEYS.blocked,blockedSlots)){blockedSlots.pop();return;}form.reset();if(date)date.min=minDate();msg("scheduleMessage","Jadwal berhasil diblokir.");draw();});draw();
}
document.addEventListener("DOMContentLoaded",()=>{updateNavigation();initAuth();initBookingForm();initSearch();if(document.getElementById("table")){if(!requireLogin())return;renderBookings();}updateBookingCount();initSchedule();});
