<script lang="ts" setup>
import { ref } from "vue";
import router from "../router";

const URL = ref("91.107.192.39");
//const URL = ref("events-logs.loca.lt");

const show1 = ref(false);
const show2 = ref(false);

// Script rules of forms
const Username = ref("");
function UsernameRules() {
  if (Username.value.length <= 3)
    return "Username must be at least 3 characters.";
}

const Email = ref("");
function EmailRules() {
  if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(Email.value)) return true;

  return "Must be a valid e-mail.";
}

const Password = ref("");
function PasswordRules() {
  if (Password.value.length > 7) return true;

  return "Password must be at least 7 characters.";
}

const ConfirmPassword = ref("");
function ConfirmPasswordRules() {
  if (ConfirmPassword.value == Password.value) return true;

  return "Password doesn't match.";
}
// Timeout
const timer = ref();
const timer2 = ref();

function Timertoken() {
  timer.value = setTimeout(() => {
    // Change the value of the object after an hour

    localStorage.removeItem("token");
    token.value = "";
  }, 600000);
}
const token = ref("");
const Message = ref("");

// Function that  create the account

async function CreateAccount() {
  if (Username.value !== "" && Email.value !== "" && Password.value !== "") {
    const res = await fetch(`http://${URL.value}/v1/user`, {
      method: "POST",
      body: new URLSearchParams({
        username: Username.value,
        email: Email.value,
        password: Password.value,
      }),
    });
    const resJson = await res.json();
    if (resJson.type == "success") {
      Message.value = "";
      token.value = resJson.res.token;
      localStorage.setItem("token", token.value);
      Timertoken();

      router.push("/");
    } else {
      Message.value = resJson.message;
    }
  }
}
</script>

<template>
  <!-- Create account forms -->
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
            :error-messages="Message"
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
            :type="show1 ? 'text' : 'password'"
            label="Password"
            :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="show1 = !show1"
          ></v-text-field>

          <v-text-field
            v-model="ConfirmPassword"
            :rules="[ConfirmPasswordRules]"
            :type="show2 ? 'text' : 'password'"
            label="Confirm your password"
            :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="show2 = !show2"
          ></v-text-field>

          <v-btn @click="CreateAccount()" class="mt-2" type="submit" block
            >Create account</v-btn
          >
        </v-form>
      </v-sheet>
    </v-card>
  </div>
</template>
