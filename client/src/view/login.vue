<script lang="ts" setup>
import { ref } from 'vue';
import router from "../router"

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

async function Login() {
  
    
  const res = await fetch("https://events-logs.loca.lt/v1/user/login?" + new URLSearchParams({
        'username': Username.value,
        'password': Password.value,

    }),{
    method: "GET",

  })
  const resJson = await res.json();
  
  if (resJson.type == "success"){
    token.value=resJson.res.token
    localStorage.setItem("token",token.value);
    router.push('/');

  }
  
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

         
            <v-btn class="mt-2" type="submit" block
              >Login</v-btn>

          </v-form>
          
            
        </v-sheet>
        
      </v-card>
    </div>
</template>