import React from 'react';
import jaronPicture from '../../assets/getting-ready.jpg';
import venmoLogo from '../../assets/venmo.png';
import Map from '../../components/Map';

const Placeholder = () => {
  const location = {
    address: '156 East 550 North Bountiful, UT 84010',
    lat: 40.89523,
    lng: -111.87739,
  };

  return (
    <>
      <div className="bg-white mt-8 md:w-2/3 m-auto">
        <div className="p-8">
          <div className="md:flex">
            <img className="md:w-1/2" src={jaronPicture} alt="cooking pizza" />
            <div className="bg-slate-200 rounded-md ml-8 p-8 text-lg">
              <p>
                Hey, my name is Jaron, and I{' '}
                <span className="italic">really</span> enjoy making pizza! I
                have an amazing Gozney Dome that rolls around 850°F and cooks a
                pizza in about 90 seconds.
              </p>
              <p className="mt-8">
                I'll be setup every <span className="font-bold">Friday</span>{' '}
                (rain or shine) in my backyard from{' '}
                <span className="font-bold">5:30pm-7pm</span> with my delicious
                homemade sauce and dough. Each pizza is $5, feel free to Venmo
                or bring cash.
              </p>
              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  <a
                    href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="pointer-events-auto text-xl decoration-red-600 underline font-bold">
                      Directions to my backyard!
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://account.venmo.com/u/Jaron-Johnson-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <script
          src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
          async
        ></script>
        <div
          className="pa-carousel-widget"
          style={{ width: '100%', height: 480, display: 'none' }}
          data-link="https://photos.app.goo.gl/VhX7haevqzFb8KiB6"
          data-title="Backyard Brick Oven Pizzas"
          data-description="8 new items added to shared album"
          data-delay="3"
          data-background-color="#FFFFFF"
        >
          <object
            data="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/cGQG0UjgT5zzgBatklWjO_E3mGX0wzBaOLTLquGvFTPETMLTFPjraRH8eRPI1NSYZK8GWqwZrBIFIIjT4RpTx3kY9G8RvZPZ8oG2WaK1h79rzR8Sab7GXzFQfSDWLwn3CYb5QeJ3QyA=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/FOLI8sLciTE-KuS0u4IRNZLWqeL1NHzEaY67KupHeaw8Gy9vZVWU7PRdfMcN64MSoauOY0T-JUUkt9QxRCdYB8FXLD8aXDNEAzrBwYylYMnJzLlh6M-E9SubGgzUzw_iqF0aT8iWE-M=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/IWG3PykFLRbocdpIMcdRi4LzEtAbxLtL4z5u_RYtTS9IPB-eZbKvsv1NLiFu7s4GBC2B8R8NMa-qRNzg7cOY4HzIlHHjuCXKXnCSXzXmlcZtzgFnBSkqFOmcWxS10eUYG7nu5hfjqgw=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/vo3LnPtBI-DRsYdZzGbjN7Mha_3CJQ86ai-wD8uqzmUoiWQz0mNB4APV5VVP6lQm8PbZHmWzc3UYXfNHPtVgsl5wXTmEkAaeEy4e5-AplZY0rZ1FYEblsSELZFAV_caA9ICX6NTvFPg=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/IJdSlXuYySQTgezpf7JP5-XYTc4xeTQKhdBFIbLipFAuyIU0SAdNvfaiVeXWznGDt9vUpcUio4yeLn_kKXIBwhm4kYqrn4XDioyAEPgQEwi5zKhiJxmZbv79no3ZvWViZqeUvIANS_A=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/rLwpZ3reSS37JPGa0K85Re-s7rojHW0_vR8T0F_ymZHWJCoiNenWs5Xe9vMxdTgMFJTFfJxbhUGNjGpLw1ZfBlOmXzi_QsilHZBYUkKJIk1IQweQ3cBgQvqKOUPH8dLVApUzB0ZChvw=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/jAIVzq2Iyk2WdmmPx3ZXqp-2J_cJtJYTk0a03fOWRd-YPH61-4uUFVUO3Blw4F11WmzThI5DkTW0gQbzdhcm0810UzxUVmGHlspSwseDmmOrMZDhyt0t_6lF9ZhnyNIh_yJFwHIhFJY=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/RgziarQnf2y7H_Z-sqKup3qatQ7d6wqDQ1ooaTzAUfmDWtDXTPPaDev9fr42QuNO8KfjXVasnStqj3tf-fR9RpkDIcU9keyvm4HZUMB0V4dEamkOCdNa56J6oKc4cv2WAcF5LuEcjvg=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/DNo68aQiKk3ZzZWNmeM4AXSTX781pOC7Pxs2UztR2uFsY_QJZms8Q-b1iBDO1POnvL-cg5-wEzNT8GewK-vOpIv8pWYu31qwU7we-dTm_Bh0qmz0Ao8dlNeFdniMsY0T6075q02jGn4=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/5mbIstmKlDUF7TJJR9OBXki8LgU7yqKRWWeKVHpEEm8hp2yB_EwWLdCFFSMpLQVSRFL9EKS54O4AtL_T0J0yHR1SrNLy5cHHp6dpVxX6_odnOCMOX1oB0s1xxYK0srDa-tvwE5MVfz0=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/AEh2KINbmG2WTr4FGoAx8l4d6cn11kRKC_exIeVF3veYCRb-Ry1HTHMrMtpjXD19_t5Cxx5JZoY-P60LyODxZ6CXjlWyKLVAALQs62izV-jEAAr0hXX1uudghtYwG2MqfUqn2D6s-8Q=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/1CSag6A_1UJYFY8WXeCjqjWOP218mEVnMFm4UGAo51JbIR2eF9zCldzX2dNxHKhiEgVso1OdmYh-kkBSTTilCorvWdaHbbweGoovndTmWFtwOm2h30-YS6xGe_LLhE5jCu0r0ssU0Lk=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/bk1B2b8uHx3c7MFisPuKp2wQLcBUhqfgOE7VWvxqDzgEyLxs7b9L-lJR3PyICAT6zASZI5AXa3FugL-eheMLqy1wMnjEYLj4nmXrP2UgQvCaFAtW_2GcReOdumQT23OFMkkoGE0G3Bs=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/Adrh82yaqS039jEf8k2h_KvMj7llVhmvh592t8XqKQqCRNi-aefRSMPh1SFSZSWdL4Ql68Z3QE2CqE2CCDgtatncnzLz-8YZuCZuw2Jw5r_MMsyIAkZ78EFgQQpq9qVfBNhpWAUTAXs=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/CHU6WfZkf1AJ54IBtpnAw82Wrfw3vokml-ALGqQXT7Cs6p0vgTLRdCdkhWocWW8dkefu9Q1T5nOSg5tLsQHHbePvXN5X9QQko_ugLYAfgn_WmWBIyeSCeE9g2RSN_DeWYwDncLIWtaQ=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/dRmDxFFCuJc1HgRRZD_yBW1eSmUKYHY8wr-rNFGTCHyBtGyyBVwsIeqBMIHpEFRKG97CFr7Qbl-n7xUlowgdwA3_Zh55lXKs4kXlst21rH7dwLB2h8798cbDBNORTtUIht5TnoKq7Hw=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
        </div>

        {/* <Map location={location} zoomLevel={19} /> */}
        <p className="font-bold m-4">
          Early stage photos....Come back again later, we are still building out
          this site for ordering!
        </p>
      </div>
    </>
  );
};

export default Placeholder;
