<template>
  <div class="container mx-auto">
    <div class="grid grid-cols-3 mb-5">
      <div v-for="(setting, idx) in settings" :key="idx">
        <div class="block text-gray-700 text-sm font-bold mb-2">{{setting.attributes.Key}}</div>
        <div class="block text-gray-700 text-sm font-bold mb-2">{{showMap[setting.attributes.Value]}}</div>
      </div>
      <SettingModal :settings="settings" />
    </div>
    <div class="grid grid-cols-2">
      <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="userId">
          User ID
        </label>
        <input 
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          id="userId" 
          type="text" 
          placeholder="Please input user ID to analyze"
          v-model="userId"
        />
      </div>
      <div class="mx-auto">
        <button
          @click="handleDownload"
          class="px-6 py-2 text-white bg-blue-600 rounded shadow"
          type="button"
        >
          Download CSV
        </button>
      </div>
    </div>
    <div class="grid grid-cols-2">
      <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="userId">
          Report Date
        </label>
        <input 
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          id="reportDate" 
          type="date"
          v-model="reportDate"
        />
      </div>
      <div class="mx-auto">
        <button
          @click="handleDownloadDate"
          class="px-6 py-2 text-white bg-blue-600 rounded shadow"
          type="button"
        >
          Download CSV
        </button>
      </div>
    </div>
    <PreAdminForm :onIDApproved="handleIdApproved" />
  </div>
</template>

<script>
import qs from 'qs';
import moment from 'moment';
import PreAdminForm from './PreAdminForm.vue'
export default {
  name: 'Admin',
  components: { PreAdminForm },
  props: ['settings'],
  data() {
    return {
      showMap: {
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '300': '5 mins',
        '600': '10 mins',
        '900': '15 mins',
      },
      adminId: '',
      userId: '',
      reportDate: '',
    }
  },
  methods: {
    async handleDownload() {
      const query = qs.stringify({
        filters: {
          UserId: {
            $eq: userId.value
          }
        },
        pagination: {
          pageSize: -1
        }
      }, {
        encodeValuesOnly: true, // prettify url
      });
      const response = await this.$axios.get(`scores?${query}`);
      this.download(this.convertToCSV(this.parseData(response.data.data)));
    },
    async handleDownloadDate() {
      console.log(reportDate.value);
      const query = qs.stringify({
        pagination: {
          start: 0,
          limit: -1,
        },
        createdAt_gte: moment(reportDate.value).format('YYYY-MM-DD'),
        createdAt_lte: moment(reportDate.value).format('YYYY-MM-DD'),
      }, {
        encodeValuesOnly: true, // prettify url
      });
      const response = await this.$axios.get(`scores?${query}`);
      this.download(this.convertToCSV(this.parseData(response.data.data.filter(data => {
        if (!reportDate.value) return true;
        return moment(data.attributes.createdAt).isSame(moment(reportDate.value), 'day');
      }))));
    },
    parseData(data) {
      return data.map(el => {
        return {
          'Participant ID': el.attributes.UserId || 'NaN',
          'Game Name': el.attributes.GameId,
          'Number of Disks': el.attributes.NumberOfDisks,
          'Time to complete the game (minutes)': (el.attributes.ElapsedTime/60).toFixed(2),
          'Total number of moves': el.attributes.TotalMoves,
          'Total number of correct moves': el.attributes.CorrectMoves,
          'Total number of wrong moves': el.attributes.TotalMoves - el.attributes.CorrectMoves
        };
      })
    },
    download(data) {
      // Creating a Blob for having a csv file format
      // and passing the data with type
      const blob = new Blob([data], { type: 'text/csv' });
  
      // Creating an object for downloading url
      const url = window.URL.createObjectURL(blob)
  
      // Creating an anchor(a) tag of HTML
      const a = document.createElement('a')
  
      // Passing the blob downloading url
      a.setAttribute('href', url)
  
      // Setting the anchor tag attribute for downloading
      // and passing the download file name
      a.setAttribute('download', 'download.csv');
  
      // Performing a download with click
      a.click()
    },
    convertToCSV(objArray) {
      let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
      let str = '';
      if (array.length === 0) return str;

      let headLine = '';
      for (let key in array[0]) {
        if (headLine !== '') headLine += ',';

        headLine += key;
      }
      str += headLine + '\r\n';
      
      for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
          if (line != '') line += ','

          line += array[i][index];
        }

        str += line + '\r\n';
      }

      return str;
    },
    handleIdApproved(adminId) {
      this.adminId = adminId;
    },
  }
}
</script>
