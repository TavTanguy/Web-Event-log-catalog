<script lang="ts" setup>
import { ref } from 'vue';
import router from "../router"

const URL= ref("91.107.192.39")
// Script rules of forms
const Username = ref("")
const show1 = ref(false)

//Connection

const token=ref("")


function UsernameRules(){
  if (Username.value.length > 3) return true;

  return "Username must be at least 3 characters.";
}

const Password = ref("")
function PasswordRules(){
  if (Password.value.length > 7) return true;

  return "Password must be at least 7 characters.";
}

// Timeout
const timer=ref()
const timer2= ref()

function Timertoken() {

timer.value = setTimeout(() => {

  // Change the value of the object after 10 seconds

  localStorage.removeItem("token");
  token.value = ""
  

}, 600000)



}

const NoMatch=ref(false)

async function Login() {
  
    
  const res = await fetch(`http://${URL.value}/v1/user/login?` + new URLSearchParams({
        'username': Username.value,
        'password': Password.value,

    }),{
    method: "GET",

  })
  const resJson = await res.json();
  
  if (resJson.type == "success"){
    token.value=resJson.res.token
    localStorage.setItem("token",token.value);
    Timertoken();
    router.push('/');
   
  }
  else { NoMatch.value=true } 
} 



</script>

<template>
    <div>
        <v-card>
        <v-card-title primary-title>
          {{ "Login" }}
        </v-card-title>
        <v-card-text>
          <div id="gd"></div>
        </v-card-text>

        <v-sheet class="mx-auto" width="300">
          <v-form fast-fail @submit.prevent="Login">
            <v-text-field
              v-model="Username"
              :rules="[UsernameRules]"
              label="Username"
            ></v-text-field>

            <v-text-field
              v-model="Password"
              :rules="[PasswordRules]"
              :type="show1 ? 'text' : 'password'"
              label="Password"
              :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="show1 = !show1"
            ></v-text-field>

         
            <v-btn @click="Login" class="mt-2" type="submit" block
              >Login</v-btn>

          </v-form>
          
            
        </v-sheet>
        
      </v-card>
      <v-dialog
      v-model="NoMatch"
      max-width="300"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Wrong informations error
          <v-icon color="red" icon="mdi-alert-circle" size="small"></v-icon>
        </v-card-title>
      </v-card>
    </v-dialog>
    </div>
</template>