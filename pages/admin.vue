<template>
  <div>
    <SettingModal :settings="settings" />
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'AdminPage',
  data() {
    return {
      settings: []
    }
  },
  async mounted () {
    try {
      const response = await this.$axios.get('settings');
      this.settings = response.data.data;
    } catch (error) {
      console.error(error);
    }
  }
}
</script>
