<template>
  <div>
    <Admin :settings="$store.state.settings.list" />
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'AdminPage',
  data() {
    return {
    }
  },
  async mounted () {
    try {
      const settingsResponse = await this.$axios.get('settings');
      this.$store.commit('settings/set', settingsResponse.data.data);
    } catch (error) {
      console.error(error);
    }
  }
}
</script>
