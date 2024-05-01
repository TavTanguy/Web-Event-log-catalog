<script lang="ts" setup>
import { ref } from 'vue';

// Script rules of forms
const Username = ref("")
function UsernameRules(){
  if (Username.value.length > 3) return true;

  return "Username must be at least 3 characters.";
}

const Email = ref("")
function EmailRules(){
  if (Email.value.length > 1) return true;

  return "Email must be at least 1 characters.";
}


const Password = ref("")
function PasswordRules(){
  if (Password.value.length > 7) return true;

  return "Password must be at least 7 characters.";
}

const ConfirmPassword = ref("")
function ConfirmPasswordRules(){
  if (ConfirmPassword.value == Password.value) return true;

  return "Password doesn't match.";
}

async function CreateAccount() {
  const res = await fetch("https://events-logs.loca.lt/v1/user", {
    method: "POST",
    body: new URLSearchParams({
        'username': Username.value,
        'email': Email.value,
        'password': Password.value,

    })
  })
}

</script>

<template>
    <div>
        <v-card>
        <v-card-title primary-title>
          {{ "Create your account" }}
        </v-card-title>
        <v-card-text>
          <div id="gd"></div>
        </v-card-text>

        <v-sheet class="mx-auto" width="300">
          <v-form fast-fail @submit.prevent>
            <v-text-field
              v-model="Username"
              :rules="[UsernameRules]"
              label="Username"
            ></v-text-field>

            <v-text-field
              v-model="Email"
              :rules="[EmailRules]"
              label="Email"
            ></v-text-field>

            <v-text-field
              v-model="Password"
              :rules="[PasswordRules]"
              label="Password"
            ></v-text-field>

            <v-text-field
              v-model="ConfirmPassword"
              :rules="[ConfirmPasswordRules]"
              label="Confirm your password"
            ></v-text-field>

         
            <v-btn @click="CreateAccount()" class="mt-2"  type="submit" block
              ><router-link to="/">Create account</router-link></v-btn>

          </v-form>
          
            
        </v-sheet>
        
      </v-card>
    </div>
</template>