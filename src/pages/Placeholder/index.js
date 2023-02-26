import React from 'react';
import jaronPicture from '../../assets/jare-pizza-action.jpeg';
import venmoLogo from '../../assets/venmo.png';
import facebookLogo from '../../assets/facebook.png';
import instagramLogo from '../../assets/instagram.png';
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
            <div className="md:w-1/2 align-middle">
              <img src={jaronPicture} alt="cooking pizza" />
            </div>
            <div className="md:w-1/2 bg-slate-200 rounded-md ml-8 p-8 text-lg">
              <p>
                Hey, my name is Jaron, and I{' '}
                <span className="italic">really</span> enjoy making pizza! I
                have an amazing Gozney Dome© that rolls around 850°F and cooks a
                pizza in about 75 seconds.
              </p>
              <p className="mt-8">
                We'll be setup every <span className="font-bold">Friday</span>{' '}
                (rain or shine) in my backyard from{' '}
                <span className="font-bold">5:30pm-7pm</span> with my homemade
                sauce, dough and toppings, come pick whatever you want on your
                pizza and we'll make it for you on the spot. Each pizza is $7,
                feel free to Venmo or bring cash.
              </p>
              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  <a
                    href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="pointer-events-auto text-xl decoration-red-600 underline font-bold">
                      Click here for directions to my backyard!
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://www.instagram.com/backyardbrickovenllc/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={instagramLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={facebookLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://account.venmo.com/u/backyard-brick-oven"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
              {/* <div>We also cater! Reach out on Instagram or Facebook and we can talk details.</div> */}
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
          <script
            src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
            async
          ></script>
          <div
            class="pa-gallery-player-widget"
            style={{ width: '100%', height: '480px', display: 'none' }}
            data-link="https://photos.app.goo.gl/VhX7haevqzFb8KiB6"
            data-title="Backyard Brick Oven Pizzas"
            data-description="21 new items added to shared album"
          >
            <object
              data="https://lh3.googleusercontent.com/cGQG0UjgT5zzgBatklWjO_E3mGX0wzBaOLTLquGvFTPETMLTFPjraRH8eRPI1NSYZK8GWqwZrBIFIIjT4RpTx3kY9G8RvZPZ8oG2WaK1h79rzR8Sab7GXzFQfSDWLwn3CYb5QeJ3QyA=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/cGQG0UjgT5zzgBatklWjO_E3mGX0wzBaOLTLquGvFTPETMLTFPjraRH8eRPI1NSYZK8GWqwZrBIFIIjT4RpTx3kY9G8RvZPZ8oG2WaK1h79rzR8Sab7GXzFQfSDWLwn3CYb5QeJ3QyA=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/FOLI8sLciTE-KuS0u4IRNZLWqeL1NHzEaY67KupHeaw8Gy9vZVWU7PRdfMcN64MSoauOY0T-JUUkt9QxRCdYB8FXLD8aXDNEAzrBwYylYMnJzLlh6M-E9SubGgzUzw_iqF0aT8iWE-M=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/FOLI8sLciTE-KuS0u4IRNZLWqeL1NHzEaY67KupHeaw8Gy9vZVWU7PRdfMcN64MSoauOY0T-JUUkt9QxRCdYB8FXLD8aXDNEAzrBwYylYMnJzLlh6M-E9SubGgzUzw_iqF0aT8iWE-M=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/vo3LnPtBI-DRsYdZzGbjN7Mha_3CJQ86ai-wD8uqzmUoiWQz0mNB4APV5VVP6lQm8PbZHmWzc3UYXfNHPtVgsl5wXTmEkAaeEy4e5-AplZY0rZ1FYEblsSELZFAV_caA9ICX6NTvFPg=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/vo3LnPtBI-DRsYdZzGbjN7Mha_3CJQ86ai-wD8uqzmUoiWQz0mNB4APV5VVP6lQm8PbZHmWzc3UYXfNHPtVgsl5wXTmEkAaeEy4e5-AplZY0rZ1FYEblsSELZFAV_caA9ICX6NTvFPg=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/rLwpZ3reSS37JPGa0K85Re-s7rojHW0_vR8T0F_ymZHWJCoiNenWs5Xe9vMxdTgMFJTFfJxbhUGNjGpLw1ZfBlOmXzi_QsilHZBYUkKJIk1IQweQ3cBgQvqKOUPH8dLVApUzB0ZChvw=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/rLwpZ3reSS37JPGa0K85Re-s7rojHW0_vR8T0F_ymZHWJCoiNenWs5Xe9vMxdTgMFJTFfJxbhUGNjGpLw1ZfBlOmXzi_QsilHZBYUkKJIk1IQweQ3cBgQvqKOUPH8dLVApUzB0ZChvw=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/jAIVzq2Iyk2WdmmPx3ZXqp-2J_cJtJYTk0a03fOWRd-YPH61-4uUFVUO3Blw4F11WmzThI5DkTW0gQbzdhcm0810UzxUVmGHlspSwseDmmOrMZDhyt0t_6lF9ZhnyNIh_yJFwHIhFJY=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/jAIVzq2Iyk2WdmmPx3ZXqp-2J_cJtJYTk0a03fOWRd-YPH61-4uUFVUO3Blw4F11WmzThI5DkTW0gQbzdhcm0810UzxUVmGHlspSwseDmmOrMZDhyt0t_6lF9ZhnyNIh_yJFwHIhFJY=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/DNo68aQiKk3ZzZWNmeM4AXSTX781pOC7Pxs2UztR2uFsY_QJZms8Q-b1iBDO1POnvL-cg5-wEzNT8GewK-vOpIv8pWYu31qwU7we-dTm_Bh0qmz0Ao8dlNeFdniMsY0T6075q02jGn4=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/DNo68aQiKk3ZzZWNmeM4AXSTX781pOC7Pxs2UztR2uFsY_QJZms8Q-b1iBDO1POnvL-cg5-wEzNT8GewK-vOpIv8pWYu31qwU7we-dTm_Bh0qmz0Ao8dlNeFdniMsY0T6075q02jGn4=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/5mbIstmKlDUF7TJJR9OBXki8LgU7yqKRWWeKVHpEEm8hp2yB_EwWLdCFFSMpLQVSRFL9EKS54O4AtL_T0J0yHR1SrNLy5cHHp6dpVxX6_odnOCMOX1oB0s1xxYK0srDa-tvwE5MVfz0=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/5mbIstmKlDUF7TJJR9OBXki8LgU7yqKRWWeKVHpEEm8hp2yB_EwWLdCFFSMpLQVSRFL9EKS54O4AtL_T0J0yHR1SrNLy5cHHp6dpVxX6_odnOCMOX1oB0s1xxYK0srDa-tvwE5MVfz0=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/1CSag6A_1UJYFY8WXeCjqjWOP218mEVnMFm4UGAo51JbIR2eF9zCldzX2dNxHKhiEgVso1OdmYh-kkBSTTilCorvWdaHbbweGoovndTmWFtwOm2h30-YS6xGe_LLhE5jCu0r0ssU0Lk=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/1CSag6A_1UJYFY8WXeCjqjWOP218mEVnMFm4UGAo51JbIR2eF9zCldzX2dNxHKhiEgVso1OdmYh-kkBSTTilCorvWdaHbbweGoovndTmWFtwOm2h30-YS6xGe_LLhE5jCu0r0ssU0Lk=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/hgVHWkasdBCMxdSeVZPipiznOhrAphjS9OjxtNvEQP_T_Yx_OpM2QQQmixpMT59ZzjISagMxIbyx8RED90qhteAfA9fQmPQp1VBtOppAqBs2PgAai5IztzQ4vF9WwKEU14MVSnkk-98=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/hgVHWkasdBCMxdSeVZPipiznOhrAphjS9OjxtNvEQP_T_Yx_OpM2QQQmixpMT59ZzjISagMxIbyx8RED90qhteAfA9fQmPQp1VBtOppAqBs2PgAai5IztzQ4vF9WwKEU14MVSnkk-98=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/bk1B2b8uHx3c7MFisPuKp2wQLcBUhqfgOE7VWvxqDzgEyLxs7b9L-lJR3PyICAT6zASZI5AXa3FugL-eheMLqy1wMnjEYLj4nmXrP2UgQvCaFAtW_2GcReOdumQT23OFMkkoGE0G3Bs=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/bk1B2b8uHx3c7MFisPuKp2wQLcBUhqfgOE7VWvxqDzgEyLxs7b9L-lJR3PyICAT6zASZI5AXa3FugL-eheMLqy1wMnjEYLj4nmXrP2UgQvCaFAtW_2GcReOdumQT23OFMkkoGE0G3Bs=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/Adrh82yaqS039jEf8k2h_KvMj7llVhmvh592t8XqKQqCRNi-aefRSMPh1SFSZSWdL4Ql68Z3QE2CqE2CCDgtatncnzLz-8YZuCZuw2Jw5r_MMsyIAkZ78EFgQQpq9qVfBNhpWAUTAXs=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/Adrh82yaqS039jEf8k2h_KvMj7llVhmvh592t8XqKQqCRNi-aefRSMPh1SFSZSWdL4Ql68Z3QE2CqE2CCDgtatncnzLz-8YZuCZuw2Jw5r_MMsyIAkZ78EFgQQpq9qVfBNhpWAUTAXs=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/C75FkFSGkiY044Fza68RGbp3JMa3zfWeZeSxIewZxsbOD2yChSrRe0xiUnlq7c5USdhM2ucgQSnRr4NdEepiC0RGAyMWNjXceJNXuEb65ALFHaGr-gsmim6E4Ul4tj3TMygAkwPY7vw=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/C75FkFSGkiY044Fza68RGbp3JMa3zfWeZeSxIewZxsbOD2yChSrRe0xiUnlq7c5USdhM2ucgQSnRr4NdEepiC0RGAyMWNjXceJNXuEb65ALFHaGr-gsmim6E4Ul4tj3TMygAkwPY7vw=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/CHU6WfZkf1AJ54IBtpnAw82Wrfw3vokml-ALGqQXT7Cs6p0vgTLRdCdkhWocWW8dkefu9Q1T5nOSg5tLsQHHbePvXN5X9QQko_ugLYAfgn_WmWBIyeSCeE9g2RSN_DeWYwDncLIWtaQ=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/CHU6WfZkf1AJ54IBtpnAw82Wrfw3vokml-ALGqQXT7Cs6p0vgTLRdCdkhWocWW8dkefu9Q1T5nOSg5tLsQHHbePvXN5X9QQko_ugLYAfgn_WmWBIyeSCeE9g2RSN_DeWYwDncLIWtaQ=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/GalxNYatMLEL_M4z-C6QqcFbmbnncIdKSupvJtrlGj673uywr9B36CoyJXnRR7O0Tl6im8rhhTkQYCQvlY-TKARCq9ydhJ3ZlnInQ-7tgNt5ER3zB7PqlsTRSj9gD1mMjeRUaXunN2g=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/GalxNYatMLEL_M4z-C6QqcFbmbnncIdKSupvJtrlGj673uywr9B36CoyJXnRR7O0Tl6im8rhhTkQYCQvlY-TKARCq9ydhJ3ZlnInQ-7tgNt5ER3zB7PqlsTRSj9gD1mMjeRUaXunN2g=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/b4IBcSGbRvekdRGh4MpfFvK8-t_XURWH0-y7z1Rqg3dh02iOHkqyr6Tx_6yMeBWnUu14_Pjssa9OROraFGVPgg2o_eWS3bkRLWe1nxftVWvvxA4k2NOAgVEGZZjZRPc7EoY6LTEAvaI=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/b4IBcSGbRvekdRGh4MpfFvK8-t_XURWH0-y7z1Rqg3dh02iOHkqyr6Tx_6yMeBWnUu14_Pjssa9OROraFGVPgg2o_eWS3bkRLWe1nxftVWvvxA4k2NOAgVEGZZjZRPc7EoY6LTEAvaI=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/8UUyMiI51tnfJHu4ViZ8h7GcV7ZjmxSJHC_nqKtFZq3y8rNX67BAcL_jz2sBO_RZieub8v0y9EG0sFKXIgcVxO2JiFkPx7yzx6E53ODOl6zWvuS95zwK00g9A8Fu3sJNBEoHKjIjgMY=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/8UUyMiI51tnfJHu4ViZ8h7GcV7ZjmxSJHC_nqKtFZq3y8rNX67BAcL_jz2sBO_RZieub8v0y9EG0sFKXIgcVxO2JiFkPx7yzx6E53ODOl6zWvuS95zwK00g9A8Fu3sJNBEoHKjIjgMY=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/xjxyk5vVVK5xw39yBkXWmGhsB8B6PwLkPs2ehPTp_xZGVBZAHyjEVQBA_V8wsVQxX2KYVE1lQhHPqHiz8qkrHZSExem_AawMYO9H520ebELXJ1IyI5Xqa-WVswqlY9jaXRQv9nTcI5E=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/xjxyk5vVVK5xw39yBkXWmGhsB8B6PwLkPs2ehPTp_xZGVBZAHyjEVQBA_V8wsVQxX2KYVE1lQhHPqHiz8qkrHZSExem_AawMYO9H520ebELXJ1IyI5Xqa-WVswqlY9jaXRQv9nTcI5E=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/I5KtehbE1en6TDhrmjVZlyA3h3BHn2XKuc2mAdzcQuuw6NTrWKpy2lRrx42Mjpry1-LgIROi1kyYGG6GBwVrboYxP5DQKHrXr2oJ14ZXlshnbti0JT4iRM1tHxEmMsqjBrECk7hbGvM=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/I5KtehbE1en6TDhrmjVZlyA3h3BHn2XKuc2mAdzcQuuw6NTrWKpy2lRrx42Mjpry1-LgIROi1kyYGG6GBwVrboYxP5DQKHrXr2oJ14ZXlshnbti0JT4iRM1tHxEmMsqjBrECk7hbGvM=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/rM9asFjhGQG7-ajqfc5OVwp3ns9LLYMiQSQ7DHmexT8Ww5Sl1TVMjlZxmZa8Fa_De30iTiSH7RcK_0xulP5BPsFvb2rn4kT1vbBVcaA7p9W6cTI1m6IvR929Jo-AANhXpz19aChtVvo=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/rM9asFjhGQG7-ajqfc5OVwp3ns9LLYMiQSQ7DHmexT8Ww5Sl1TVMjlZxmZa8Fa_De30iTiSH7RcK_0xulP5BPsFvb2rn4kT1vbBVcaA7p9W6cTI1m6IvR929Jo-AANhXpz19aChtVvo=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/PU8YVC6nigR7kJt80JMWkC147O5JLYbefUjrnU2qD4OqUzUZwbAEad3FVFHlDSPcH7jlEkEaslKj0KsWD0LtdJQaouJcfRJZJzt36iyy-x_HOi1CmVS4S7sUfIqjG3BpMzOR_3PoS6g=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/PU8YVC6nigR7kJt80JMWkC147O5JLYbefUjrnU2qD4OqUzUZwbAEad3FVFHlDSPcH7jlEkEaslKj0KsWD0LtdJQaouJcfRJZJzt36iyy-x_HOi1CmVS4S7sUfIqjG3BpMzOR_3PoS6g=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/P1IkF3NwurYiYj19qYheZesmL1Rd8CHWn_skLyEp7xMAfHxJJ8IDVDWueSCKQgzAXE6TMH5zOZt8tkrVHoIc06w0sPO4h8qyIA0uAZHl0j4UV-ucy3eWRkofK42Oo_1qyUFGJKZm3Dk=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/P1IkF3NwurYiYj19qYheZesmL1Rd8CHWn_skLyEp7xMAfHxJJ8IDVDWueSCKQgzAXE6TMH5zOZt8tkrVHoIc06w0sPO4h8qyIA0uAZHl0j4UV-ucy3eWRkofK42Oo_1qyUFGJKZm3Dk=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/dfLgIwhE6oPDn12xIrl7aOH37ZvN53uSZB9p5Dtb994bjlob7AmqjeUnqmuTqHRdJ4yXLD74Eat4ni6IZjB9ejsaIJCqbUwowpHf405YK0GnzAt60mnknNqGg1rNyb-wMpFg6nkWRVM=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/dfLgIwhE6oPDn12xIrl7aOH37ZvN53uSZB9p5Dtb994bjlob7AmqjeUnqmuTqHRdJ4yXLD74Eat4ni6IZjB9ejsaIJCqbUwowpHf405YK0GnzAt60mnknNqGg1rNyb-wMpFg6nkWRVM=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/_YafkPjnxjKSnT8vXIVnL1ORFdx_SfebgKxYuK0IPb80-o6ynsxR9LjMb0s0mra15U1nuMQWzVYPYaTavQWjnOos5zRyNHby6e8907SN2DLw-jJuJe_V_XhEF-6pc1a8tt6jbGlW4IY=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/_YafkPjnxjKSnT8vXIVnL1ORFdx_SfebgKxYuK0IPb80-o6ynsxR9LjMb0s0mra15U1nuMQWzVYPYaTavQWjnOos5zRyNHby6e8907SN2DLw-jJuJe_V_XhEF-6pc1a8tt6jbGlW4IY=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/cRIi6RdjYtHIIv4NgTzMLoY4o2zgaKlX3pZttFF8K4gd1C4jjnDxeTR0Fm3qvwvuDPxGxVvzG1Axzo6BYR9wtsMOkTnbe8EQPOOh0LWTI_OAFFGE_YaBio6NVV3j5WMyTHPzdowBVW4=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/cRIi6RdjYtHIIv4NgTzMLoY4o2zgaKlX3pZttFF8K4gd1C4jjnDxeTR0Fm3qvwvuDPxGxVvzG1Axzo6BYR9wtsMOkTnbe8EQPOOh0LWTI_OAFFGE_YaBio6NVV3j5WMyTHPzdowBVW4=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/PFb-cl69zK2xaorVImTkzSVySv6bFbaYoWgWOQxyYjD68p1ERLU8tvMKilYHb2ei66zLx0OSK2JKAnRR985ZzgpXih5dQlJkuWxLAHHTtrFPjHXJlJ3KyW4pE8teBYSepL6zinTJvUA=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/PFb-cl69zK2xaorVImTkzSVySv6bFbaYoWgWOQxyYjD68p1ERLU8tvMKilYHb2ei66zLx0OSK2JKAnRR985ZzgpXih5dQlJkuWxLAHHTtrFPjHXJlJ3KyW4pE8teBYSepL6zinTJvUA=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/SSz3iPqtKzRWQgSenXH1-ol8GzU1yZ4g-m1ZHzIVeQW5I2OvY0_chl3jGmzqYprfbM8QRy5i3hIs-4CCz_vfARvRAax_tOegUXrlt_c4lU7ic_IbjYZfBHu1H_IiOUx7jJJlEDfR7R8=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/SSz3iPqtKzRWQgSenXH1-ol8GzU1yZ4g-m1ZHzIVeQW5I2OvY0_chl3jGmzqYprfbM8QRy5i3hIs-4CCz_vfARvRAax_tOegUXrlt_c4lU7ic_IbjYZfBHu1H_IiOUx7jJJlEDfR7R8=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/2cvfzgwtE2TRcKCXmAqr2X0P10je2NZg54OxucgrKy-a6NDxP-13plJY0n1XrxXc9fOwkSTYfDb8QJBoCfOR0-6xjb1zRXr3vQkGaM46oAJVSMIBGsH6Exme1UO--WnG5hlI_A2smzk=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/2cvfzgwtE2TRcKCXmAqr2X0P10je2NZg54OxucgrKy-a6NDxP-13plJY0n1XrxXc9fOwkSTYfDb8QJBoCfOR0-6xjb1zRXr3vQkGaM46oAJVSMIBGsH6Exme1UO--WnG5hlI_A2smzk=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/M1tL4nCpkWulKtkosrAPqxJM9dhzvF-juhXJ85a1BZgJLF6L_qFzYkMZLmu-fkG7Wqv5wOBdrsV9OlDWIS5Zn_jPvzhQ-Nt1ALqsYs4hAWqe-PaXDxym-SJe5sL6YTF1wqXbyPgvElQ=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/M1tL4nCpkWulKtkosrAPqxJM9dhzvF-juhXJ85a1BZgJLF6L_qFzYkMZLmu-fkG7Wqv5wOBdrsV9OlDWIS5Zn_jPvzhQ-Nt1ALqsYs4hAWqe-PaXDxym-SJe5sL6YTF1wqXbyPgvElQ=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/ckjya7Uw-L-qenLyZ7o8WofIGy_I9IZKDJE4DFj-9WqKVPurX8s3cNJkzoYdqw6NAZ7u4qUhPP-ZXm_9oCEZFa8Jh9BoyUA29xWPGlyJ4AkVGChhq3YP6mcJ2c7fh5G5Ekj2fcGspoM=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/ckjya7Uw-L-qenLyZ7o8WofIGy_I9IZKDJE4DFj-9WqKVPurX8s3cNJkzoYdqw6NAZ7u4qUhPP-ZXm_9oCEZFa8Jh9BoyUA29xWPGlyJ4AkVGChhq3YP6mcJ2c7fh5G5Ekj2fcGspoM=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/pSatxuISHl7HK88UTBSt2YU5u79vMknAP04CBgNwmBHsbxS-PkglGRFtXnxSR5BHs-NvXe5IjkqGVbTjKeazjoiXtLHVk546V4N7qFyG1FsNDCwvyBkObB8SF-lAxsVgNIah30gxWEs=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/pSatxuISHl7HK88UTBSt2YU5u79vMknAP04CBgNwmBHsbxS-PkglGRFtXnxSR5BHs-NvXe5IjkqGVbTjKeazjoiXtLHVk546V4N7qFyG1FsNDCwvyBkObB8SF-lAxsVgNIah30gxWEs=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/oN6Esfx4B8NIhVhA8IKEaDPl0TQj2PRq93BP6WPUhAyxGkPtW7nrYQ0vy932BBpv7Sn8CoLHSMc6J88FlxvsRhGxqdhCsRqN5RGh0uMVHndSVmD3eCL2zZhScu1kBAo8imNsWYT1RVc=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/oN6Esfx4B8NIhVhA8IKEaDPl0TQj2PRq93BP6WPUhAyxGkPtW7nrYQ0vy932BBpv7Sn8CoLHSMc6J88FlxvsRhGxqdhCsRqN5RGh0uMVHndSVmD3eCL2zZhScu1kBAo8imNsWYT1RVc=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/JxQ41atB02lUszveIDpsi-d2WRGkmpDzNoItv5V26mePwBKfsETYRzHTdq4VKoii5-39cUUR4OLGf2C_HNNdZfRVhBrqC_4s9wGq9wic_N_jkxZBsDt4M5MWhMmYVREHryPIDqG0MG4=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/JxQ41atB02lUszveIDpsi-d2WRGkmpDzNoItv5V26mePwBKfsETYRzHTdq4VKoii5-39cUUR4OLGf2C_HNNdZfRVhBrqC_4s9wGq9wic_N_jkxZBsDt4M5MWhMmYVREHryPIDqG0MG4=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/D96t11VfQKU3412OxYGlYCaRCF6Yn-_Atq32gc07LaBPou9SScfcgOpR9bqvyY0ORQ965kxp8A-Z3QVPOtGnUrCVskw2jx9MSsGNUhh-I7mAvVakcuMO6QRcUiRLAh0xVJbCPPZyjQ0=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/D96t11VfQKU3412OxYGlYCaRCF6Yn-_Atq32gc07LaBPou9SScfcgOpR9bqvyY0ORQ965kxp8A-Z3QVPOtGnUrCVskw2jx9MSsGNUhh-I7mAvVakcuMO6QRcUiRLAh0xVJbCPPZyjQ0=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/WTmReN2ynMcAnzR53-QopmjILyEx49ZlSsNkTKiqbI_JvjfkMvG3O0dLf8jm0W2lr2_0oePjrnVFJkhdFciiOGjs8pyxss_JMxqvDnBapo016IJBruDLhq4wlfuWpwQKY7RMGHNAUNo=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/WTmReN2ynMcAnzR53-QopmjILyEx49ZlSsNkTKiqbI_JvjfkMvG3O0dLf8jm0W2lr2_0oePjrnVFJkhdFciiOGjs8pyxss_JMxqvDnBapo016IJBruDLhq4wlfuWpwQKY7RMGHNAUNo=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/PTHbK8UxajiYDCnuo_vRcVChrUuhGpqTzfLuhWQcp27CtnAJlahZCukEk8heIioyRieyHmBoZMP_JaIkPVi2O5WY5G2OIMRA5B4n0byjbUC943rtB7nL-DezZfKeQ__xLmo46qhmIdM=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/PTHbK8UxajiYDCnuo_vRcVChrUuhGpqTzfLuhWQcp27CtnAJlahZCukEk8heIioyRieyHmBoZMP_JaIkPVi2O5WY5G2OIMRA5B4n0byjbUC943rtB7nL-DezZfKeQ__xLmo46qhmIdM=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/K3RpTSPXmMldd2TgGVS9A896EXcZKmgK4NEXVmizfrwdbxFfxo2tSizj0KL-AdSPaXlzILbf1Aw4KS1ZaYm8gNgrmR1Yx-1Jbpxj3H23W3K77LMmk7UqctkMC2YOCtjwK-j79bJSfAQ=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/K3RpTSPXmMldd2TgGVS9A896EXcZKmgK4NEXVmizfrwdbxFfxo2tSizj0KL-AdSPaXlzILbf1Aw4KS1ZaYm8gNgrmR1Yx-1Jbpxj3H23W3K77LMmk7UqctkMC2YOCtjwK-j79bJSfAQ=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/Gxu-ju-ZAp8veFX6br82mt0J-0hWBq50dpNS3nZZl622pAJCb-5zZ0cpzaxqd1ZQhBXFIGWv_I2LacSGad-6piGNirCzlrhpNAqsf355Ps9NcuRTu5ehI9WmCoNJchNjsznqpdDjwoc=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/Gxu-ju-ZAp8veFX6br82mt0J-0hWBq50dpNS3nZZl622pAJCb-5zZ0cpzaxqd1ZQhBXFIGWv_I2LacSGad-6piGNirCzlrhpNAqsf355Ps9NcuRTu5ehI9WmCoNJchNjsznqpdDjwoc=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/oNfrLwrIi0A6EMyGRAAnBMStSGSZ4uQoeT6q_H3yuD5TLHg2ihLn_THV1Ap6AL1xsjeF-ZHspAWGrDMUk6JvUmNYhfJEMWcoKZU833PlJZ14md2fj4-PNkcN0H7290JYJ5st-q5UyrE=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/oNfrLwrIi0A6EMyGRAAnBMStSGSZ4uQoeT6q_H3yuD5TLHg2ihLn_THV1Ap6AL1xsjeF-ZHspAWGrDMUk6JvUmNYhfJEMWcoKZU833PlJZ14md2fj4-PNkcN0H7290JYJ5st-q5UyrE=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/cHzmUfajPtDqpLV9yPEtNL3DGoN4MPDYJxUtJetpFpblaP7-R2ckW13qePRbqF4e8Rx0SpGU7XwWcpe1j3J6ssz9rNGa_tSuGUiAKb8Vlu_W1EgJX4-BM06BcCCk5_oxpro4vPvSCZE=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/cHzmUfajPtDqpLV9yPEtNL3DGoN4MPDYJxUtJetpFpblaP7-R2ckW13qePRbqF4e8Rx0SpGU7XwWcpe1j3J6ssz9rNGa_tSuGUiAKb8Vlu_W1EgJX4-BM06BcCCk5_oxpro4vPvSCZE=w1920-h1080"
            ></object>
            <object
              data="https://lh3.googleusercontent.com/4b81Tk7Thpawr8qKEEBM5ciwN33rt1RY2jGGCdNEhYekeuTkbjxL9MvSSnpFKPsiv3M9LCNcjWrWB2Rulpga_p1IcI_4dGEV8tUApR3OJy-oWvaGTKC4bzHEMNtUhvokUOB_4fyHAZg=w1920-h1080"
              aria-label="https://lh3.googleusercontent.com/4b81Tk7Thpawr8qKEEBM5ciwN33rt1RY2jGGCdNEhYekeuTkbjxL9MvSSnpFKPsiv3M9LCNcjWrWB2Rulpga_p1IcI_4dGEV8tUApR3OJy-oWvaGTKC4bzHEMNtUhvokUOB_4fyHAZg=w1920-h1080"
            ></object>
          </div>
        </div>

        {/* <Map location={location} zoomLevel={19} /> */}
        <br />
        <p>
          We are open to catering! Hit us up on our social media for any
          inquiries.
        </p>
        <br />
      </div>
    </>
  );
};

export default Placeholder;
