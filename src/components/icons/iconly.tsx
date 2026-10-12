type IconlyIconProps = {
      size?:number;
      color?:string;
  }
  
  export const IconlyArrowRight = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.1501 12L4.74988 12" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M13.7001 5.97541L19.7501 11.9994L13.7001 18.0244" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }

  export const IconlyDiscount = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.9981 6.5L6 18.4981" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M16.5729 15.6445C17.3613 15.6445 18.0012 16.2844 18.0012 17.0729C18.0012 17.8613 17.3613 18.5012 16.5729 18.5012C15.7844 18.5012 15.1445 17.8613 15.1445 17.0729C15.1445 16.2844 15.7844 15.6445 16.5729 15.6445Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.42835 6.5C8.2168 6.5 8.8567 7.1399 8.8567 7.92835C8.8567 8.7168 8.2168 9.3567 7.42835 9.3567C6.6399 9.3567 6 8.7168 6 7.92835C6 7.1399 6.6399 6.5 7.42835 6.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
      ) 
  }

  export const IconlyDocument = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.0416 9.229H8.97162" stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round"></path>
            <path d="M11.2876 13.3931H8.97162" stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round"></path>
            <path d="M4.22699 2.75V21.25H20.973V2.75H4.22699Z" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }
  
  export const IconlyGraph = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.4765 13.4959C18.4765 15.0295 18.0217 16.5286 17.1697 17.8037C16.3177 19.0788 15.1068 20.0727 13.6899 20.6595C12.2731 21.2464 10.7141 21.4 9.20999 21.1008C7.7059 20.8016 6.3243 20.0631 5.23991 18.9787C4.15552 17.8943 3.41704 16.5127 3.11786 15.0086C2.81868 13.5045 2.97223 11.9455 3.5591 10.5287C4.14596 9.11186 5.13979 7.90088 6.4149 7.04888C7.69001 6.19688 9.18913 5.74213 10.7227 5.74213L10.7227 13.4959H18.4765Z" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M13.7774 2.75006C15.8338 2.75006 17.806 3.56698 19.2601 5.0211C20.7143 6.47522 21.5312 8.44744 21.5312 10.5039L13.7774 10.5039L13.7774 2.75006Z" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }

 export const IconlyWallet = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8806 16.7095H17.8064C16.3104 16.7087 15.0978 15.6057 15.0969 14.2438C15.0969 12.8819 16.3104 11.7789 17.8064 11.7781H21.8806" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M2.61938 5.72595H21.8807V21.25H2.61938V5.72595Z" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M19.2486 5.628V2.75074L2.61938 2.75V21.2495" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M7.18384 10.2938H12.6174" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }

export const IconlyActivity = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.26074 9.88364H21.248V11.3836H3.26074V9.88364Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M15.6088 13.4962H17.1173V14.9962H15.6088V13.4962Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M11.5045 13.4962H13.013V14.9962H11.5045V13.4962Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.39117 13.4962H8.89974V14.9962H7.39117V13.4962Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M15.6088 17.0912H17.1173V18.5912H15.6088V17.0912Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M11.5045 17.0912H13.013V18.5912H11.5045V17.0912Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.39117 17.0912H8.89974V18.5912H7.39117V17.0912Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M16.7408 3.03467V7.57865H15.2408V3.03467H16.7408Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M9.26855 3.03467V7.57865H7.76855V3.03467H9.26855Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M3.17578 4.49536H21.3258V23.0347H3.17578V4.49536ZM4.67578 5.99536V21.5347H19.8258V5.99536H4.67578Z" fill={color}></path>
            </svg>
      ) 
  }

export const IconlyAddUser = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M20.043 8.41895V13.9289H18.543V8.41895H20.043Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M16.498 10.4238H22.088V11.9238H16.498V10.4238Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.171 4C8.14347 4 6.5 5.64275 6.5 7.66973C6.5 9.69672 8.14347 11.3395 10.171 11.3395C12.1971 11.3395 13.8408 9.69686 13.8408 7.66973C13.8408 5.6426 12.1971 4 10.171 4ZM5 7.66973C5 4.81374 7.31562 2.5 10.171 2.5C13.0253 2.5 15.3408 4.81389 15.3408 7.66973C15.3408 10.5256 13.0253 12.8395 10.171 12.8395C7.31562 12.8395 5 10.5257 5 7.66973Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M4.08399 19.685C5.86797 20.6222 7.94447 21.0057 10.2032 21.0001H10.2068C12.4655 21.0057 14.542 20.6222 16.3259 19.685C15.3015 17.2392 13.0146 16.0617 10.2069 16.0689H10.2031C7.39191 16.0617 5.10872 17.2364 4.08399 19.685ZM10.205 14.5689C6.70556 14.5605 3.5886 16.1881 2.44701 19.7981L2.26976 20.3586L2.77172 20.6646C4.97609 22.0084 7.53873 22.5064 10.205 22.5001C12.8713 22.5064 15.4339 22.0084 17.6383 20.6646L18.1402 20.3586L17.963 19.7981C16.8226 16.1917 13.701 14.5605 10.205 14.5689Z" fill={color}></path>
            </svg>
      ) 
  }

export const IconlyPlus = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.9996 8.6123V17.4387H11.4996V8.6123H12.9996Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.83398 12.2751H16.6673V13.7751H7.83398V12.2751Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M2.25 23.0347L2.25 3.03467L22.25 3.03467L22.25 23.0347L2.25 23.0347ZM3.75 21.5347L20.75 21.5347L20.75 4.53467L3.75 4.53467L3.75 21.5347Z" fill={color}></path>
            </svg>
      ) 
  }

export const IconlyChart = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.41367 10.9624V16.9922" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M12.2506 8.07715V16.9923" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M17.0865 14.1489V16.9924" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M21.5 21.7847L21.5 3.28467L3 3.28467L3 21.7847L21.5 21.7847Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
      ) 
  }

  export const IconlyHome = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
        return (
              <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <title>Iconly/Light/Home</title>
                    <g id="Iconly/Light/Home" stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
                          <g id="Home" transform="translate(2.500000, 2.000000)" stroke={color} strokeWidth="1.5">
                                <path d="M6.65721519,18.7714023 L6.65721519,15.70467 C6.65719744,14.9246392 7.29311743,14.2908272 8.08101266,14.2855921 L10.9670886,14.2855921 C11.7587434,14.2855921 12.4005063,14.9209349 12.4005063,15.70467 L12.4005063,15.70467 L12.4005063,18.7809263 C12.4003226,19.4432001 12.9342557,19.984478 13.603038,20 L15.5270886,20 C17.4451246,20 19,18.4606794 19,16.5618312 L19,16.5618312 L19,7.8378351 C18.9897577,7.09082692 18.6354747,6.38934919 18.0379747,5.93303245 L11.4577215,0.685301154 C10.3049347,-0.228433718 8.66620456,-0.228433718 7.51341772,0.685301154 L0.962025316,5.94255646 C0.362258604,6.39702249 0.00738668938,7.09966612 0,7.84735911 L0,16.5618312 C0,18.4606794 1.55487539,20 3.47291139,20 L5.39696203,20 C6.08235439,20 6.63797468,19.4499381 6.63797468,18.7714023 L6.63797468,18.7714023"></path>
                          </g>
                    </g>
              </svg>
        )
  }

  export const IconlySearch = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.2485 3.50024C7.22315 3.50024 3.95996 6.76343 3.95996 10.7888C3.95996 14.8141 7.22315 18.0773 11.2485 18.0773C15.2738 18.0773 18.537 14.8141 18.537 10.7888C18.537 6.76343 15.2738 3.50024 11.2485 3.50024ZM2.45996 10.7888C2.45996 5.93501 6.39472 2.00024 11.2485 2.00024C16.1023 2.00024 20.037 5.93501 20.037 10.7888C20.037 15.6426 16.1023 19.5773 11.2485 19.5773C6.39472 19.5773 2.45996 15.6426 2.45996 10.7888Z" fill={color}></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.7359 15.6477L22.3514 21.2486L21.2921 22.3106L15.6766 16.7097L16.7359 15.6477Z" fill={color}></path>
            </svg>
      )
}

export const IconlyUser = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill={color} fillRule="evenodd" d="M7.75 7.5a4.25 4.25 0 1 1 8.5 0a4.25 4.25 0 0 1-8.5 0M12 4.75a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 0 0 0-5.5m-4 10A2.25 2.25 0 0 0 5.75 17v1.188c0 .018.013.034.031.037c4.119.672 8.32.672 12.438 0a.04.04 0 0 0 .031-.037V17A2.25 2.25 0 0 0 16 14.75h-.34a.3.3 0 0 0-.079.012l-.865.283a8.75 8.75 0 0 1-5.432 0l-.866-.283a.3.3 0 0 0-.077-.012zM4.25 17A3.75 3.75 0 0 1 8 13.25h.34q.28.001.544.086l.866.283a7.25 7.25 0 0 0 4.5 0l.866-.283c.175-.057.359-.086.543-.086H16A3.75 3.75 0 0 1 19.75 17v1.188c0 .754-.546 1.396-1.29 1.517a40.1 40.1 0 0 1-12.92 0a1.54 1.54 0 0 1-1.29-1.517z" clipRule="evenodd" />
            </svg>

      )
}

export const FiCheckCircle = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m4 12l6 6L20 6" />
            </svg>
      )
}

export const FiXCircle = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="none" stroke={color} strokeLinecap="round" strokeWidth="2" d="M20 20L4 4m16 0L4 20" />
            </svg>

      )
}

export const IconlyShow = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0022 10.0361C10.6703 10.0361 9.59021 11.1155 9.59021 12.4481C9.59021 13.7799 10.6704 14.8601 12.0022 14.8601C13.334 14.8601 14.4142 13.7799 14.4142 12.4481C14.4142 11.1155 13.3342 10.0361 12.0022 10.0361ZM8.09021 12.4481C8.09021 10.2867 9.84215 8.5361 12.0022 8.5361C14.1623 8.5361 15.9142 10.2867 15.9142 12.4481C15.9142 14.6083 14.1624 16.3601 12.0022 16.3601C9.842 16.3601 8.09021 14.6083 8.09021 12.4481Z" fill={color}></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.97577 6.99435C6.77017 5.47727 9.25098 4.39609 12.0022 4.39609C14.7529 4.39609 17.2337 5.47642 19.0282 6.99314C20.8033 8.49335 22.0042 10.5101 22.0042 12.4481C22.0042 14.3861 20.8033 16.4028 19.0282 17.903C17.2337 19.4198 14.7529 20.5001 12.0022 20.5001C9.25098 20.5001 6.77017 19.4189 4.97577 17.9018C3.20099 16.4013 2.00024 14.3846 2.00024 12.4481C2.00024 10.5116 3.20099 8.49485 4.97577 6.99435ZM5.94422 8.13983C4.3705 9.47033 3.50024 11.1046 3.50024 12.4481C3.50024 13.7916 4.3705 15.4258 5.94422 16.7564C7.49832 18.0703 9.64351 19.0001 12.0022 19.0001C14.3606 19.0001 16.5058 18.0709 18.06 16.7574C19.6337 15.4273 20.5042 13.7931 20.5042 12.4481C20.5042 11.1031 19.6337 9.46883 18.06 8.13878C16.5058 6.82525 14.3606 5.89609 12.0022 5.89609C9.64351 5.89609 7.49832 6.82591 5.94422 8.13983Z" fill={color}></path>
            </svg>
      )
}

export const IconlyHide = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.58279 20.8134C3.72879 20.9604 3.92079 21.0334 4.11279 21.0334C4.30479 21.0334 4.49679 20.9604 4.64279 20.8134L6.8693 18.5868C6.92208 18.5468 6.97024 18.4991 7.01201 18.4441L20.4168 5.03936C20.7098 4.74636 20.7098 4.27136 20.4168 3.97836C20.1238 3.68536 19.6498 3.68536 19.3568 3.97836L17.4787 5.85659C15.8036 4.8682 13.9202 4.34845 11.9958 4.34845C6.45585 4.34845 1.99585 8.75245 1.99585 12.3984C1.99585 14.3482 3.25178 16.5047 5.25638 18.0797L3.58279 19.7534C3.28979 20.0464 3.28979 20.5204 3.58279 20.8134ZM6.32619 17.0098C4.61299 15.7148 3.49585 13.918 3.49585 12.3984C3.49585 9.45045 7.41785 5.84845 11.9958 5.84845C13.5225 5.84845 15.0206 6.22983 16.3776 6.95776L14.1842 9.15125C13.5423 8.71895 12.7766 8.48004 11.9977 8.48004H11.9887C10.9437 8.48204 9.96272 8.89104 9.22472 9.63104C8.48772 10.371 8.08272 11.354 8.08572 12.394C8.0827 13.1742 8.32084 13.9406 8.75435 14.5815L6.32619 17.0098ZM9.84732 13.4884L13.0907 10.2448C12.754 10.0729 12.3779 9.98004 11.9967 9.98004H11.9917C11.3467 9.98104 10.7417 10.233 10.2877 10.689C9.83372 11.146 9.58372 11.751 9.58572 12.395C9.58392 12.7775 9.67612 13.153 9.84732 13.4884Z" fill={color}></path>
                  <path d="M11.9942 20.4492C11.0472 20.4492 10.0962 20.3192 9.16418 20.0612C8.76518 19.9512 8.53118 19.5382 8.64118 19.1392C8.75118 18.7392 9.16718 18.5062 9.56418 18.6162C10.3652 18.8372 11.1822 18.9492 11.9942 18.9492C16.5772 18.9492 20.5042 15.3472 20.5042 12.3982C20.5042 11.4432 20.0602 10.3542 19.2552 9.33423C18.9992 9.00923 19.0552 8.53723 19.3802 8.28023C19.7052 8.02423 20.1772 8.07923 20.4332 8.40423C21.4462 9.68923 22.0042 11.1072 22.0042 12.3982C22.0042 16.0452 17.5392 20.4492 11.9942 20.4492Z" fill={color}></path>
                  <path d="M12.5662 16.25C12.2112 16.25 11.8962 15.997 11.8292 15.636C11.7542 15.229 12.0242 14.837 12.4322 14.763C13.4112 14.582 14.1892 13.804 14.3662 12.824C14.4402 12.416 14.8292 12.148 15.2382 12.22C15.6452 12.294 15.9162 12.684 15.8422 13.092C15.5542 14.682 14.2932 15.945 12.7022 16.237C12.6572 16.246 12.6112 16.25 12.5662 16.25Z" fill={color}></path>
            </svg>
      )
}

export const IconlyLoader = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill={color} d="M12,23a9.63,9.63,0,0,1-8-9.5,9.51,9.51,0,0,1,6.79-9.1A1.66,1.66,0,0,0,12,2.81h0a1.67,1.67,0,0,0-1.94-1.64A11,11,0,0,0,12,23Z">
                        <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
                  </path>
            </svg>
      )
}

  
  export const IconlyTrash = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <title>Iconly/Light/Delete</title>
                <g id="Iconly/Light/Delete" stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
                    <g id="Delete" transform="translate(3.000000, 2.000000)" stroke={color} strokeWidth="1.5">
                        <path d="M16.3249,7.4682 C16.3249,7.4682 15.7819,14.2032 15.4669,17.0402 C15.3169,18.3952 14.4799,19.1892 13.1089,19.2142 C10.4999,19.2612 7.8879,19.2642 5.2799,19.2092 C3.9609,19.1822 3.1379,18.3782 2.9909,17.0472 C2.6739,14.1852 2.1339,7.4682 2.1339,7.4682" id="Stroke-1"></path>
                        <line x1="17.7082" y1="4.2397" x2="0.7502" y2="4.2397" id="Stroke-3"></line>
                        <path d="M14.4406,4.2397 C13.6556,4.2397 12.9796,3.6847 12.8256,2.9157 L12.5826,1.6997 C12.4326,1.1387 11.9246,0.7507 11.3456,0.7507 L7.1126,0.7507 C6.5336,0.7507 6.0256,1.1387 5.8756,1.6997 L5.6326,2.9157 C5.4786,3.6847 4.8026,4.2397 4.0176,4.2397" id="Stroke-5"></path>
                    </g>
                </g>
            </svg>
      ) 
  }

  export const IconlyEdit = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <title>Iconly/Light-Outline/Edit</title>
                <g id="Iconly/Light-Outline/Edit" stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd">
                    <g id="Edit" transform="translate(2.000000, 3.000000)" fill={color}>
                        <path d="M18.7504743,17.4395426 C19.1644743,17.4395426 19.5004743,17.7755426 19.5004743,18.1895426 C19.5004743,18.6035426 19.1644743,18.9395426 18.7504743,18.9395426 L11.4974743,18.9395426 C11.0834743,18.9395426 10.7474743,18.6035426 10.7474743,18.1895426 C10.7474743,17.7755426 11.0834743,17.4395426 11.4974743,17.4395426 L18.7504743,17.4395426 Z M14.1162743,0.653642644 C14.1662743,0.692642644 15.8392743,1.99264264 15.8392743,1.99264264 C16.4472743,2.35464264 16.9222743,3.00164264 17.1022743,3.76764264 C17.2812743,4.52564264 17.1512743,5.30764264 16.7342743,5.96864264 C16.7314843,5.97305264 16.7287267,5.97740594 16.7190724,5.99036671 L16.7115384,6.00037748 C16.6438514,6.08958254 16.3496103,6.46163507 14.8645637,8.32222949 C14.8507703,8.34661541 14.8351388,8.36945203 14.8180743,8.39164264 C14.7930299,8.42435375 14.7657794,8.45442349 14.736689,8.48180241 C14.6353903,8.60933705 14.5284065,8.74334814 14.4159195,8.88423852 L14.1879908,9.16970248 C13.7176954,9.7586788 13.1598596,10.4570865 12.4980586,11.2854628 L12.1584183,11.7105768 C10.8807459,13.3097378 9.24443431,15.3572426 7.14827431,17.9796426 C6.68927431,18.5516426 6.00127431,18.8846426 5.26227431,18.8936426 L1.62327431,18.9396426 L1.61327431,18.9396426 C1.26627431,18.9396426 0.964274306,18.7016426 0.883274306,18.3626426 L0.0642743057,14.8916426 C-0.104725694,14.1726426 0.0632743057,13.4306426 0.524274306,12.8546426 L9.94427431,1.07264264 C9.94827431,1.06864264 9.95127431,1.06364264 9.95527431,1.05964264 C10.9882743,-0.175357356 12.8562743,-0.357357356 14.1162743,0.653642644 Z M8.894,4.787 L1.69527431,13.7916426 C1.52427431,14.0056426 1.46127431,14.2816426 1.52427431,14.5466426 L2.20527431,17.4316426 L5.24427431,17.3936426 C5.53327431,17.3906426 5.80027431,17.2616426 5.97727431,17.0416426 C6.88875764,15.901226 8.03433097,14.4678757 9.21212914,12.9940199 L9.62883197,12.4725647 L9.62883197,12.4725647 L10.0462387,11.9502119 C11.1508202,10.5678883 12.2420592,9.20206663 13.1551253,8.05886375 L8.894,4.787 Z M11.1102743,2.01664264 L9.831,3.615 L14.0917742,6.88592888 C14.9118863,5.85869797 15.4513975,5.1821385 15.5012743,5.11764264 C15.6652743,4.85164264 15.7292743,4.47564264 15.6432743,4.11364264 C15.5552743,3.74264264 15.3242743,3.42764264 14.9912743,3.22664264 C14.9202743,3.17764264 13.2352743,1.86964264 13.1832743,1.82864264 C12.5492743,1.32064264 11.6242743,1.40864264 11.1102743,2.01664264 Z" id="Combined-Shape"></path>
                    </g>
                </g>
            </svg>
      ) 
  }

  
  export const IconlyLocation2 = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.10046 10.2392C9.10046 8.49902 10.5107 7.08881 12.2509 7.08881C13.9903 7.08881 15.4003 8.49922 15.4003 10.2392C15.4003 11.9784 13.9901 13.3886 12.2509 13.3886C10.5109 13.3886 9.10046 11.9786 9.10046 10.2392ZM12.2509 8.58881C11.3391 8.58881 10.6005 9.32745 10.6005 10.2392C10.6005 11.1498 11.3389 11.8886 12.2509 11.8886C13.1617 11.8886 13.9003 11.15 13.9003 10.2392C13.9003 9.32725 13.1615 8.58881 12.2509 8.58881Z" fill={color}></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M12.2495 3.38867C8.71322 3.38867 5.6882 6.58767 5.79986 10.1892C5.87884 12.7368 7.48388 14.757 9.26953 16.7085C9.44886 16.9045 9.63097 17.1008 9.81318 17.2973C10.5078 18.0462 11.2036 18.7965 11.7511 19.5318C11.9255 19.7661 12.0913 20.0069 12.2417 20.2544C12.3964 19.9975 12.5679 19.7482 12.7491 19.5061C13.2994 18.7708 13.9995 18.0265 14.6964 17.2855C14.8764 17.0942 15.0562 16.9031 15.2331 16.7124C17.0152 14.7917 18.6205 12.7948 18.7001 10.1896C18.8101 6.58751 15.7856 3.38867 12.2495 3.38867ZM12.9995 22.6387C12.9995 21.9554 13.3239 21.2414 13.95 20.4049C14.4447 19.7439 15.0676 19.0813 15.7559 18.349C15.9437 18.1492 16.1364 17.9442 16.3327 17.7327C18.1062 15.8212 20.101 13.4547 20.1994 10.2354C20.3342 5.82228 16.6666 1.88867 12.2495 1.88867C7.83264 1.88867 4.16375 5.82223 4.30058 10.2357C4.39855 13.3956 6.39315 15.787 8.16291 17.7211C8.36125 17.9378 8.55603 18.148 8.7459 18.3528C9.43178 19.0928 10.0536 19.7637 10.5479 20.4276C11.1778 21.2737 11.4995 21.9821 11.4995 22.6387H12.9995Z" fill={color}></path>
            </svg>
      ) 
  }


  export const IconlyLogout = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.019 11.9997L8.24121 11.9997" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M18.479 8.7251L21.7686 12.0001L18.479 15.2761" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M13.2554 16.625L13.2554 21.25L2.73144 21.25L2.73144 2.75L13.2554 2.75L13.2554 7.375" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }


  
  export const IconlyPaper = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <title>Iconly/Light-Outline/Paper</title>
                <g id="Iconly/Light-Outline/Paper" stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd">
                    <g id="Paper" transform="translate(3.000000, 2.000000)" fill={color}>
                        <path d="M10.9755,0.0003 C11.018449,0.0003 11.0605585,0.00391613217 11.1015405,0.0108603403 L11.2384,0.0117 C11.4424,0.0117 11.6374,0.0947 11.7794,0.2417 L16.8444,5.5187 C16.9784,5.6577 17.0535234,5.8447 17.0535234,6.0377 L17.0535234,15.2037 C17.0714,17.7127 15.1174,19.7627 12.6044,19.8647 L4.5854,19.8657 L4.4764,19.8657 C2.02645714,19.8103286 0.061562449,17.8289196 0.0017018309,15.4028786 L0.0014,4.4907 C0.0594,2.0097 2.1084,0.0117 4.5714,0.0117 L10.8494595,0.0108603403 C10.8904415,0.00391613217 10.932551,0.0003 10.9755,0.0003 Z M10.2254,1.5113 L4.5734,1.5117 C2.9164,1.5117 1.5404,2.8537 1.5014,4.5087 L1.5014,15.2037 C1.4644,16.9167 2.8144,18.3277 4.5104,18.3657 L12.5744,18.3657 C14.2434,18.2967 15.5654,16.9097 15.553481,15.2097 L15.5534,6.9833 L13.5435,6.9843 C11.7135,6.9793 10.2255,5.4873 10.2255,3.6593 L10.2254,1.5113 Z M10.7887,12.6084 C11.2027,12.6084 11.5387,12.9444 11.5387,13.3584 C11.5387,13.7724 11.2027,14.1084 10.7887,14.1084 L5.3887,14.1084 C4.9747,14.1084 4.6387,13.7724 4.6387,13.3584 C4.6387,12.9444 4.9747,12.6084 5.3887,12.6084 L10.7887,12.6084 Z M8.7438,8.8564 C9.1578,8.8564 9.4938,9.1924 9.4938,9.6064 C9.4938,10.0204 9.1578,10.3564 8.7438,10.3564 L5.3878,10.3564 C4.9738,10.3564 4.6378,10.0204 4.6378,9.6064 C4.6378,9.1924 4.9738,8.8564 5.3878,8.8564 L8.7438,8.8564 Z M11.7254,2.3523 L11.7255,3.6593 C11.7255,4.6633 12.5425,5.4813 13.5455,5.4843 L14.7314,5.4833 L11.7254,2.3523 Z" id="Combined-Shape"></path>
                    </g>
                </g>
            </svg>
      ) 
  }


  
  export const IconlyDownload = ({ size = 24, color = "#000000" }: IconlyIconProps) => {
      return (
            <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.2497 15.935V3.15723" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M8.9751 13.395L12.2501 16.6846L15.5261 13.395" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            <path d="M16.875 9.41406H21.5V20.8429H3V9.41406H7.625" stroke={color} strokeWidth="1.5" strokeLinecap="square"></path>
            </svg>
      ) 
  }